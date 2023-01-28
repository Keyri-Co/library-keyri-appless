import ApplessBrowser from "./browser";
import ApplessMobile from "../mobile";

export default class ApplessLocal {

    #browser;
    #mobile;

    #RP_REGISTER_API_URL;
    #RP_VALIDATE_API_URL;
    #VERIFICATION_CALLBACK;

  /////////////////////////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////////////////////////
    constructor(RP_REGISTER_API_URL, RP_VALIDATE_API_URL, VERIFICATION_CALLBACK){

      //
      // We'll need these later to register / validate the user's requests
      //
        this.#RP_REGISTER_API_URL = RP_REGISTER_API_URL;
        this.#RP_VALIDATE_API_URL = RP_VALIDATE_API_URL;
        this.#VERIFICATION_CALLBACK = VERIFICATION_CALLBACK;

        this.#browser = new ApplessBrowser();
        this.#mobile = new ApplessMobile();

    }

  /////////////////////////////////////////////////////////////////////////////
  //
  // REGISTER YOUR LOCAL DEVICE
  //
  /////////////////////////////////////////////////////////////////////////////
    register = async (METADATA) => {

      if(!METADATA){
        throw new Error("Second Argument (METADATA) Cannot Be Blank! RP Needs Some Way To Identify Who Is Making Request.");
      }

      //
      // Start the mobile script to expose its methods locally
      //
      await this.#mobile.start(true);
      
      // Back and forth between the browser and RP and Browser
      const registrationData = await this.#browser.register(this.#RP_REGISTER_API_URL, METADATA);
      
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
  registerMobile = async (METADATA, IFRAME, PASSWORD) => {

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
    iFrameArgs.RP_API_URL = this.#RP_REGISTER_API_URL;
    iFrameArgs.METADATA = METADATA;

    if(PASSWORD){
      iFrameArgs.PASSWORD = PASSWORD;
    }

    let queryString = new URLSearchParams(iFrameArgs);
    IFRAME.src = `./KeyriQR.html?${queryString}`;
    return true;

  }


  /////////////////////////////////////////////////////////////////////////////
  //
  // RP TO VALIDATE DATA
  //
  /////////////////////////////////////////////////////////////////////////////
  rp_validate_data = async (data) => {

    let options = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    };

    let rpResponse = await fetch(this.#RP_VALIDATE_API_URL, options).then(async (data) => {
      return data.json();
    });

    return await this.#VERIFICATION_CALLBACK(rpResponse);

  }
}
