export const PRODUCT_IDS=Object.freeze(['wk_lives_5','wk_time_60','wk_time_240']);
const approved=new Set(PRODUCT_IDS);

export function normalizeProducts(products=[]){
 const normalized={};
 for(const product of products){
  if(!approved.has(product?.id)||typeof product.displayPrice!=='string'||!product.displayPrice.trim())continue;
  normalized[product.id]={id:product.id,displayPrice:product.displayPrice,title:typeof product.title==='string'?product.title:''};
 }
 return normalized;
}

export function isApprovedProduct(productId){return approved.has(productId);}
