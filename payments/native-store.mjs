import {isApprovedProduct} from './catalog.mjs';
const IOS_BUNDLE='com.kamilunavo.wondercaps',ANDROID_PACKAGE='com.kamilunavo.wunderkapseln';
function fingerprint(value){let a=2166136261,b=2246822519;for(let i=0;i<value.length;i++){const code=value.charCodeAt(i);a=Math.imul(a^code,16777619);b=Math.imul(b^(code+i),3266489917);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
export async function verifyStorePurchase(purchase){
 if(!purchase||purchase.purchaseState!=='purchased'||purchase.quantity!==1||!isApprovedProduct(purchase.productId))return {status:'rejected'};
 if(purchase.store==='apple'){
  if(!purchase.transactionId||purchase.revocationDateIOS||purchase.appBundleIdIOS&&purchase.appBundleIdIOS!==IOS_BUNDLE)return {status:'rejected'};
  return {status:'allocated',allocation:{id:`apple:${purchase.transactionId}`,productId:purchase.productId,quantity:1}};
 }
 if(purchase.store==='google'){
  if(purchase.packageNameAndroid&&purchase.packageNameAndroid!==ANDROID_PACKAGE)return {status:'rejected'};
  const token=purchase.purchaseToken||purchase.id;if(typeof token!=='string'||!token)return {status:'rejected'};
  return {status:'allocated',allocation:{id:`google:${fingerprint(token)}`,productId:purchase.productId,quantity:1}};
 }
 return {status:'rejected'};
}
export function normalizeStoreError(error){const code=error?.code;if(code==='user-cancelled'||['network-error','service-disconnected','connection-closed'].includes(code))return {code};return {code:'store-error'};}
