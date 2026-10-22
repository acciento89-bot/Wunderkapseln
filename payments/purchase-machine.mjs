import {isApprovedProduct} from './catalog.mjs';

const initial=()=>({phase:'idle',productId:null,error:null});

export function createPurchaseMachine({verify,applyAllocation,finishTransaction}){
 if([verify,applyAllocation,finishTransaction].some(value=>typeof value!=='function'))throw new TypeError('purchase_dependencies');
 let state=initial();
 const set=next=>(state={...state,...next});

 async function receive(purchase){
  const productId=purchase?.productId;
  if(!isApprovedProduct(productId))return set({phase:'failed',productId,error:'product'});
  if(purchase?.purchaseState!=='purchased')return set({phase:'pending',productId,error:null});
  set({phase:'verifying',productId,error:null});
  let result;
  try{result=await verify(purchase);}catch{return set({phase:'retryable',productId,error:'network'});}
  if(!['allocated','duplicate'].includes(result?.status)||!result.allocation)return set({phase:'failed',productId,error:'verification'});
  try{
   const delivery=await applyAllocation(result.allocation);
   if(delivery?.status==='capacity')return set({phase:'capacity',productId,error:null});
   if(!['applied','duplicate'].includes(delivery?.status))return set({phase:'retryable',productId,error:'delivery'});
  }catch{return set({phase:'retryable',productId,error:'delivery'});}
  try{await finishTransaction(purchase);}catch{return set({phase:'retryable',productId,error:'finish'});}
  return set({phase:'delivered',productId,error:null});
 }

 return {
  get state(){return state;},
  begin(productId){return isApprovedProduct(productId)?set({phase:'purchasing',productId,error:null}):set({phase:'failed',productId,error:'product'});},
  receive,
  fail(error){
   if(error?.code==='user-cancelled')return set({phase:'cancelled',productId:null,error:null});
   const network=['network-error','service-disconnected','connection-closed'].includes(error?.code);
   return set({phase:'retryable',error:network?'network':'store'});
  },
  retryUnfinished(purchases=[]){return Promise.all(purchases.map(receive));},
  reset(){state=initial();return state;}
 };
}
