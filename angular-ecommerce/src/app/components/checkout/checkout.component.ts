import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { stringify } from 'querystring';
import { Country } from 'src/app/common/country';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { Purchase } from 'src/app/common/purchase';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckOutFormService } from 'src/app/services/check-out-form.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { CustomValidators } from 'src/app/validators/custom-validators';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup: FormGroup;
  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];
  countries: Country[] = [];
  shippingAddressStates: State[] = [];
  billingAddressStates : State[] = [];
  storage: Storage = sessionStorage;

  constructor(private formBuilder: FormBuilder,
              private formService: CheckOutFormService,
              private cartService: CartService,
              private checkOUtService: CheckoutService,
              private router: Router) { }

  ngOnInit(): void {
    const theEmail = JSON.parse(this.storage.getItem('userEmail'));
    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        lastName: new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        email: new FormControl(theEmail, [Validators.required, 
                                    Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        city:new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        state:new FormControl('', [Validators.required]),
        country:new FormControl('', [Validators.required]),
        zipCode:new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        city:new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        state:new FormControl('', [Validators.required]),
        country:new FormControl('', [Validators.required]),
        zipCode:new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('', [Validators.required]),
        nameOnCard:  new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        cardNumber:  new FormControl('', [Validators.required, Validators.pattern('[0-9]{16}')]),
        securityCode:  new FormControl('', [Validators.required, Validators.pattern('[0-9]{3}')]),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), CustomValidators.notOnlyWhitespace]),
        expirationMonth: new FormControl('', [Validators.required]),
        expirationYear: new FormControl('', [Validators.required]),
      }),
    });

    //populate credit card months and credit card years
    const startMonth: number = new Date().getMonth() + 1;
    this.formService.getCreditCardMonths(startMonth).subscribe(
      data=>{
        this.creditCardMonths = data;
      }
    );
    this.formService.getCreditCardYears().subscribe(
      data=>{this.creditCardYears = data}
    );

    //populate the countries
    this.formService.getCountries().subscribe(
      data=>(this.countries = data)
    );

    this.reviewCartDetails();

  }

  onSubmit() {
    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    // set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    //get cart items
    const cartItems = this.cartService.cartItems;
    let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));
    
    // set up purchase
    let purchase = new Purchase();
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;

    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    purchase.order = order;
    purchase.orderItems = orderItems;
    
    //call REST API via the CheckoutService
    this.checkOUtService.placeOrder(purchase).subscribe(
      {
        next: response=> {
          alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);
          // reset the cart: 
          this.resetCart();
        },
        error: err => {
          alert(`There was an error: ${err.message}`);
        }
      }
    )


  }

  get firstName() {return this.checkoutFormGroup.get('customer.firstName');}
  get lastName() {return this.checkoutFormGroup.get('customer.lastName');}
  get email() {return this.checkoutFormGroup.get('customer.email');}

  get shippingAddressStreet() {return this.checkoutFormGroup.get('shippingAddress.street');}
  get shippingAddressCity() {return this.checkoutFormGroup.get('shippingAddress.city');}
  get shippingAddressCountry() {return this.checkoutFormGroup.get('shippingAddress.country');}
  get shippingAddressState() {return this.checkoutFormGroup.get('shippingAddress.state');}
  get shippingAddressZipCode() {return this.checkoutFormGroup.get('shippingAddress.zipCode');}

  get billingAddressStreet() {return this.checkoutFormGroup.get('billingAddress.street');}
  get billingAddressCity() {return this.checkoutFormGroup.get('billingAddress.city');}
  get billingAddressCountry() {return this.checkoutFormGroup.get('billingAddress.country');}
  get billingAddressState() {return this.checkoutFormGroup.get('billingAddress.state');}
  get billingAddressZipCode() {return this.checkoutFormGroup.get('billingAddress.zipCode');}

  get creditCardType() {return this.checkoutFormGroup.get("creditCard.cardType");}
  get creditCardNameOnCard() {return this.checkoutFormGroup.get("creditCard.nameOnCard");}
  get creditCardNumber() {return this.checkoutFormGroup.get("creditCard.cardNumber");}
  get creditCardSecurityCode() {return this.checkoutFormGroup.get("creditCard.securityCode");}
  get creditCardZipCode() {return this.checkoutFormGroup.get("creditCard.zipCode");}
  get creditCardExpirationMonth() {return this.checkoutFormGroup.get("creditCard.expirationMonth");}
  get creditCardExpirationYear() {return this.checkoutFormGroup.get("creditCard.expirationYear");}


  copyShippingAddressToBillingAddress(event) {
    if (event.target.checked) {
      this.checkoutFormGroup.controls.billingAddress.setValue(this.checkoutFormGroup.controls.shippingAddress.value);
      this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.checkoutFormGroup.controls.billingAddress.reset();
      this.billingAddressStates = [];
    }
  }

  handleMonthsAndYears(event){
    const creditCardFormGroup = this.checkoutFormGroup.get('crediCard');
    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = +event.target.value;

    let startMonth:number;
    if(currentYear === selectedYear) startMonth = new Date().getMonth() + 1;
    else startMonth = 1;

    this.formService.getCreditCardMonths(startMonth).subscribe(
      data=> this.creditCardMonths = data
    );
  }

  getStates(formGroupName: string){
    const formGroup = this.checkoutFormGroup.get(formGroupName);
    const countryCode = formGroup.value.country.code;
    this.formService.getStates(countryCode).subscribe(
      data=>{
        if (formGroupName === 'shippingAddress') {this.shippingAddressStates = data}
        else {this.billingAddressStates = data}
        //select first item by default
        formGroup.get('state').setValue(data[0]);
      }
    );
  }

  reviewCartDetails(){
    //subscribe to cartService.totalQuantity and totalPrice
    this.cartService.totalQuantity.subscribe(totalQuantity => this.totalQuantity = totalQuantity);
    this.cartService.totalPrice.subscribe(totalPrice => this.totalPrice = totalPrice);
  }

  resetCart(){
    // reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);

    //reset the form
    this.checkoutFormGroup.reset();

    //navigate back to the products page
    this.router.navigateByUrl("/products");
  }

}
