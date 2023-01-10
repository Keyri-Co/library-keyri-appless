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
