import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../common/product';
import { map } from 'rxjs/operators';
import { ProductCategory } from '../common/product-category';

@Injectable({
  providedIn: 'root'
})

export class ProductService {

  private baseUrl = "http://localhost:8080/api/products";
  private categoryUrl = "http://localhost:8080/api/product-category"
  constructor(private httpClient: HttpClient) { }

  getProductList(theCategoryId:number): Observable<Product[]> {
    // need to build URL based on category id
    const searchUrl = `${this.baseUrl}/search/findByCategoryId?id=${theCategoryId}`;
    // returns an observable, map the JSON data from Spring Data REST to Product array
    return this.getProducts(searchUrl);
  }

  searchProducts(theKeyword: string): Observable<Product[]>{
      // need to build URL based on category id
      const searchUrl = `${this.baseUrl}/search/findByNameContaining?name=${theKeyword}`;
      // returns an observable, map the JSON data from Spring Data REST to Product array
      return this.getProducts(searchUrl);
  }

  private getProducts(searchUrl:string): Observable<Product[]>{
    return this.httpClient.get<GetResponseProducts>(searchUrl).pipe(map(response=> response._embedded.products));
  }

  getProductCategories(): Observable<ProductCategory[]> {
    return this.httpClient.get<GetResponseProductsCategory>(this.categoryUrl).pipe(
      map(response => response._embedded.productCategory)
    );
  }

  getProduct(theProductId:number): Observable<Product>{
    //need to build URL based on product id
    const productUrl = `${this.baseUrl}/${theProductId}`;
    return this.httpClient.get<Product>(productUrl);
  }

}

interface GetResponseProducts{
  _embedded:{ //"_embedded to unwrap the JSON from Spring Data REST "
    products: Product[];
  }
}

interface GetResponseProductsCategory{
  _embedded:{
    productCategory: ProductCategory[];
  }
}