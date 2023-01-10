# library-keyri-appless

## what is it?

Plug-and-Play library to add add PassKeys to your site *AND|OR* your phone!

## wait, what?!

You can put a PassKey on a user's computer OR *phone* - which they can log into your site on ANY computer by just scanning a QR-Code. No Bluetooth. No USB.

The user scans the QR, biometrics, and ¡BAM! they're logged into the computer / smart-tv / whatever. Cool AF.

## how do I use it?

We'll do the following 4 things:

1. Have Keyri QR working on your log-in page

2. Create a file called KeyriMobile.html

3. Make a slight change to your login page

4. Set up a RESTFUL end-point to verify requests and issue session tokens

## Step 1 - KeyriQR

See instructions [here](https://www.google.com)

## Step 2 - KeyriMobile.html

You can import the library by adding this repo as a dependency, or use our CDN. Whatever's clever.

#### MODULAR

```js
// package.json
  "dependencies": {
    "library-keyri-appless": "github:Keyri-Co/library-keyri-appless"
  }
```

```js
 // your-cool-javascript-file.js
  import { ApplessMobile } from "library-keyri-appless";
```


#### CDN
```html
    <script crossorigin="anonymous" src="https://s3.us-east-2.amazonaws.com/static.keyri.com/library-keyri-connect/appless-mobile.min.js" integrity="sha384-k0cE1MgO+mFU3FwYIgu0GjXibSVfPUg4n4hsOxYysg1K8MCW9spdIlr35FdwWK1T" ></script>
```

n.b. the CDN version exposes a global variable called `ApplessMobile` which is the same as you'd get by importing in from a module

#### The HTML

Somewhere on KeyriMobile.html you need a script to do the following:

```html
    <script type="module">
      const appKey = "113ce3c2-5ed7-11ed-9b6a-0242ac120002";
      const env = "prod";
    
      let mobileAppless = new ApplessMobile(env,appKey);
      await mobileAppless.start();
    </script>
```

#### You're done with KeyriMobile.html

Yup.

## 3. Login.html

You can import the library by adding this repo as a dependency, or use our CDN. Whatever's clever.

#### MODULAR

```js
 // login.js
  import { ApplessLocal } from "library-keyri-appless";
```


#### CDN
```html
    <script crossorigin="anonymous" src="https://s3.us-east-2.amazonaws.com/static.keyri.com/library-keyri-connect/appless-local.min.js" integrity="sha384-UO+RjBYcvxTZeJZiFEr+B7c8g1jxpO04mqxihyG5v0gOSk/LZxz1pw4qKQqu8yJ/" ></script>
```

n.b. the CDN version exposes a global variable called `ApplessLocal` which is the same as you'd get by importing in from a module.

#### HTML

This is pretty unique to whatever you're doing. I'll try to keep it as simple and generic as possible. (I hate when people get cute demo'ing things without covering the basics so I'll try not to do it)

```html

<script type="module">


  // The user needs to send stuff here in order to register their computer / mobile / whatever 
  const RP_API_REGISTER_URL = "https://api.bank.com/rp/register";
  const RP_API_VERIFY_URL = "https://api.bank.com/rp/verify";

  // For registration, we'll assume the user is logged in, and this is their "Im-logged-in" cookie/token
  const USER_FIREBASE_TOKEN = "010203040506070809";

  // If you're registering a mobile with QR-Code, I need to modify it - and need reference to it as an element
  const QR_IFRAME = document.getElementById("qr-frame");

  // I couldn't think of a better way to do this...
  // Pass a function to the constructor that will catch
  // what the RP passes back
  const VERIFICATION_CALLBACK = async (data) => {
    console.log("[CALLBACK::DATA",{data});
    return data;
  }


  //
  // I want to expose methods to window
  // so the buttons can have access to them. I'm sure in a real
  // framework, this isn't a thing; but here...meh: it gets the
  // job done...
  //
  let localAppless = new LocalAppless(RP_API_REGISTER_URL, RP_API_VERIFY_URL, VERIFICATION_CALLBACK);

  // n.b. Registration doesn't need verification by the RP since the user is already logged in
  window.registerMobile = () => { localAppless.registerMobile(USER_FIREBASE_TOKEN, QR_IFRAME); }
  window.registerLocal = () => {localAppless.register(USER_FIREBASE_TOKEN).then((d) => {console.log({here_is_data: d})}); }
  
  
  // n.b Authentication on the other hand...very much needs RP's assistance
  window.verifyLocal = async () => { 
    let authData = await localAppless.authenticate();

    // This is what your `VERIFICATION_CALLBACK` returns
    let authResponse = await localAppless.rp_validate_data(authData);

   }


</script>
```

## 4. Relying Party API - Endpoints

This you can set up pretty much wherever you want to, however you want to. You'll need two endpoints:

`/register` and `/verify` (they can be named whatever).


