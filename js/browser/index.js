import ApplessBrowser from "./browser";
import ApplessMobile from "../mobile/index";

export default class LocalAppless {

    #browser;
    #mobile;

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
    constructor(){
        this.#browser = new ApplessBrowser();
        this.#mobile = new ApplessMobile();
    }

  /////////////////////////////////////////////////////////////////////////////
  //
  // REGISTER YOUR LOCAL DEVICE
  //
  /////////////////////////////////////////////////////////////////////////////
    register = async (RP_API_URL, METADATA) => {

      if(!RP_API_URL){
        throw new Error("First Argument (RP_API_URL) Cannot Be Blank!");
      }

      if(!METADATA){
        throw new Error("Second Argument (METADATA) Cannot Be Blank! RP Needs Some Way To Identify Who Is Making Request.");
      }

      //
      // Start the mobile script to expose its methods locally
      //
      await this.#mobile.start(true);
      
      // Back and forth between the browser and RP and Browser
      const registrationData = await this.#browser.register(RP_API_URL, METADATA);
      
      // Perform the actual webauth stuff here...
      const mobileData = await this.#mobile.register(registrationData);

      return mobileData;

    }

  /////////////////////////////////////////////////////////////////////////////
  //
  // AUTHENTICATE LOCALLY
  //
  /////////////////////////////////////////////////////////////////////////////
    authenticate = async () => {

      await this.#mobile.start(true);
    
      const mobileData = await this.#mobile.authenticate();

      return mobileData;

    }



  /////////////////////////////////////////////////////////////////////////////
  //
  // REGISTER YOUR MOBILE-DEVICE
  //
  /////////////////////////////////////////////////////////////////////////////
  registerMobile = async (RP_API_URL, METADATA, IFRAME) => {

    if(!RP_API_URL){
      throw new Error("First Argument (RP_API_URL) Cannot Be Blank!");
    }

    if(!METADATA){
      throw new Error("Second Argument (METADATA) Cannot Be Blank! RP Needs Some Way To Identify Who Is Making Request.");
    }

    if(!IFRAME){
      throw new Error("Third Argument (IFRAME) Cannot Be Blank. I need Something to Hit");
    }
    

    //
    // Reload the IFRAME with new ARGS via its src attr
    //
    let iFrameArgs = Object.fromEntries(
      Array.from(new URL(document.location).searchParams)
    );

    iFrameArgs.register = true;
    iFrameArgs.RP_API_URL = RP_API_URL;
    iFrameArgs.METADATA = METADATA;

    let queryString = new URLSearchParams(iFrameArgs);
    IFRAME.src = `./KeyriQR.html?${queryString}`;
    return true;

  }
}
