import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useIAP} from 'react-native-iap';
import {PRODUCT_IDS,normalizeProducts,isApprovedProduct} from './catalog.mjs';
import {createPurchaseMachine} from './purchase-machine.mjs';
import {verifyStorePurchase,normalizeStoreError} from './native-store.mjs';
export function usePurchases(controller,active){
 const [status,setStatus]=useState({phase:'idle',productId:null,error:null});
 const processRef=useRef(async()=>{}),errorRef=useRef(()=>{}),inFlight=useRef(new Set());
 const iap=useIAP({onPurchaseSuccess:p=>{void processRef.current(p);},onPurchaseError:e=>errorRef.current(e),onError:e=>errorRef.current(e)});
 const apiRef=useRef(iap);apiRef.current=iap;
 const machine=useMemo(()=>createPurchaseMachine({verify:verifyStorePurchase,applyAllocation:a=>controller.applyPaidAllocation(a),finishTransaction:p=>apiRef.current.finishTransaction({purchase:p,isConsumable:true})}),[controller]);
 const publish=useCallback(next=>{setStatus({...next});return next;},[]);
 processRef.current=async purchase=>{const key=`${purchase?.store}:${purchase?.transactionId||purchase?.id||purchase?.purchaseToken||''}`;if(inFlight.current.has(key))return;inFlight.current.add(key);try{publish(await machine.receive(purchase));}finally{inFlight.current.delete(key);}};
 errorRef.current=error=>publish(machine.fail(normalizeStoreError(error)));
 useEffect(()=>{if(!active||!iap.connected)return;publish({phase:'loading',productId:null,error:null});void iap.fetchProducts({skus:PRODUCT_IDS,type:'in-app'}).then(()=>publish(machine.reset())).catch(errorRef.current);void iap.getAvailablePurchases();},[active,iap.connected,iap.fetchProducts,iap.getAvailablePurchases,machine,publish]);
 useEffect(()=>{for(const purchase of iap.availablePurchases||[])void processRef.current(purchase);},[iap.availablePurchases]);
 const buy=useCallback(async productId=>{if(!isApprovedProduct(productId)||!iap.connected)return publish({phase:'failed',productId,error:'store'});publish(machine.begin(productId));try{await iap.requestPurchase({request:{apple:{sku:productId},google:{skus:[productId]}},type:'in-app'});}catch(error){errorRef.current(error);}},[iap.connected,iap.requestPurchase,machine,publish]);
 return {products:normalizeProducts(iap.products),connected:iap.connected,status,buy,retry:()=>iap.getAvailablePurchases()};
}
