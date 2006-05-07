/*"NO (0000) \"Meldung\"\r\n"
"BYE (0000) {4+}\r\n1234\r\n"

"NO \"Meldung\"\r\n"
"BYE {4+}\r\n1234\r\n"

"NO (0000)\r\n"

"YES\r\n"*/

// *********** BASIC CLASS
function SieveAbstractResponse(parser)
{
    this.message = "";
    this.responseCode = "";
    
    if (parser.startsWith("OK"))
    {
        this.response = 0;
        parser.extract(2);
    }
    else if (parser.startsWith("BYE"))
    {
        this.response = 1;
        parser.extract(3);
    }
    else if (parser.startsWith("NO"))
    {
        this.response = 2;
        parser.extract(2);
    }
    else
        throw "YES, NO or BYE expected";

    // is there a Message?
    if (parser.isLineBreak())
        return;

    // remove the space
    parser.extractSpace();
    
    // we got an responseCode
    if (parser.startsWith("("))
    {
        // remove the opening bracket
        this.extract(1);
        
        this.responseCode = parser.extractToken(")");
        
        if (parser.isLineBreak())
            return;
             
        parser.extractSpace();
    }
    
    this.message = parser.extractString();
    
    parser.extractLineBreak();
}

SieveAbstractResponse.prototype.getMessage
    = function () { return this.message; }

SieveAbstractResponse.prototype.hasError
    = function ()
{
    if (this.response == 0)
        return false;

    return true;
}

SieveAbstractResponse.prototype.getResponse
    = function () { return this.response; }

SieveAbstractResponse.prototype.getResponseCode
    = function ()
{
  if (this.responseCode.indexOf("AUTH-TOO-WEAK") == 0)
    return new SieveRespCodeAuthTooWeak();
  else if (this.responseCode.indexOf("ENCRYPT-NEEDED") == 0)
    return new SieveRespCodeEncryptNeeded();
  else if (this.responseCode.indexOf("QUOTA") == 0)
    return new SieveRespCodeQuota();
  else if (this.responseCode.indexOf("SASL") == 0)
    return new SieveRespCodeSasl(this.responseCode);    
  else if (this.responseCode.indexOf("REFERRAL") == 0)
    return new SieveRespCodeReferral(this.responseCode);
  else if (this.responseCode.indexOf("TRANSITION-NEEDED") == 0)
    return new SieveRespCodeTransitionNeeded();
  else if (this.responseCode.indexOf("TRYLATER") == 0)
    return new SieveRespCodeTryLater();    

  return new SieveRespCodeUnknown(this.responseCode);
}

//*************************************

// encapsulates SieveAbstractScripResponse...
function SievePutScriptResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SievePutScriptResponse.prototype.getMessage
    = function () { return this.superior.getMessage(); }
    
SievePutScriptResponse.prototype.hasError 
    = function () { return this.superior.hasError(); }

SievePutScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SievePutScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************

// encapsulates SieveAbstractScripResponse...
function SieveSetActiveResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveSetActiveResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveSetActiveResponse.prototype.hasError 
    = function () { return this.superior.hasError(); }

SieveSetActiveResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveSetActiveResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }


//*************************************
function SieveCapabilitiesResponse(data)
{
    //*(string [SP string] CRLF) response-oknobye    
    
    var parser = new SieveResponseParser(data);
    while (parser.isString() )
    {
        var tag = parser.extractString();
        
        if ( parser.isLineBreak() )
        {
            parser.extractLineBreak();
            continue;            
        }
        
        parser.extractSpace();
        
        var value = parser.extractString();
        
        parser.extractLineBreak();

        if (tag.toUpperCase() == "IMPLEMENTATION")
            this.implementation = value;
        if (tag.toUpperCase() == "SASL")
            this.sasl = value;
        if (tag.toUpperCase() == "SIEVE")
            this.extensions = value;
    }
        
    this.superior = new SieveAbstractResponse(parser);
}

SieveCapabilitiesResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveCapabilitiesResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveCapabilitiesResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveCapabilitiesResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

SieveCapabilitiesResponse.prototype.getImplementation
    = function () { return this.implementation; }

SieveCapabilitiesResponse.prototype.getSasl
    = function () { return this.sasl; }
    
SieveCapabilitiesResponse.prototype.getExtensions
    = function () { return this.extensions; }

//*************************************

// encapsulates SieveAbstractScripResponse...
function SieveDeleteScriptResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveDeleteScriptResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveDeleteScriptResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveDeleteScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveDeleteScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************
function SieveListScriptResponse(data)
{
    //    sieve-name    = string
    //    string        = quoted / literal
    //    (sieve-name [SP "ACTIVE"] CRLF) response-oknobye

    var parser = new SieveResponseParser(data);
        
    this.scripts = new Array();
    var i = -1;
    
    while ( parser.isString() )
    {
        i++;

        this.scripts[i] = new Array();        
        this.scripts[i][0] = parser.extractString();
        
        if ( parser.isLineBreak() )
        {        
            this.scripts[i][1] = false;
            parser.extractLineBreak();
            
            continue;
        }
        
        parser.extractSpace();
        
        if (parser.extractToken("\r\n").toUpperCase() != "ACTIVE")
            throw "Error \"ACTIVE\" expected";

        this.scripts[i][1] = true;        
        parser.extractLineBreak();
        
    }

	// War die Anfrage erfolgreich?
    this.superior = new SieveAbstractResponse(parser);
}

SieveListScriptResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveListScriptResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveListScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveListScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }
    
SieveListScriptResponse.prototype.getScripts
    = function () { return this.scripts; }

//*************************************
function SieveStartTLSResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveStartTLSResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveStartTLSResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveStartTLSResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveStartTLSResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************
function SieveLogoutResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SieveLogoutResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SieveLogoutResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveLogoutResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveLogoutResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

//*************************************
function SievePlainLoginResponse(data)
{
    this.superior = new SieveAbstractResponse(
                        new SieveResponseParser(data));
}

SievePlainLoginResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }

SievePlainLoginResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SievePlainLoginResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SievePlainLoginResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }


/*******************************************************************************
    CLASS NAME         : SieveInitResponse
    USES CLASSES       : SieveAbstractResponse
                         SieveResposeParser
        
    CONSCTURCTOR       : SieveInitResponse(String data)
    DECLARED FUNCTIONS : String getMessage()
                       : boolean hasError()
                       : getResponse()
                       : int getResponseCode()
                       : String getImplementation()
                       : String getSasl()
                       : String getExtensions()
                       : boolean prototype.getTLS()                         
    EXCEPTIONS         : 


    AUTHOR             : Thomas Schmid        
    DESCRIPTION        : 
    ...

    EXAMPLE            :
    ...

********************************************************************************/

function SieveInitResponse(data)
{
    //*(string [SP string] CRLF) response-oknobye
    this.implementation = "";
    this.tls = false;
    this.sasl = "";
    this.extensions = "";

    var parser = new SieveResponseParser(data);
    
    while (parser.isString() )
    {
        var tag = parser.extractString();
        
        if ( parser.isLineBreak() )
        {
            parser.extractLineBreak();
            
            if (tag.toUpperCase() == "STARTTLS")
                this.tls = true; 
                
            continue;            
        }
        
        parser.extractSpace();
        
        var value = parser.extractString();
        
        parser.extractLineBreak();

        if (tag.toUpperCase() == "IMPLEMENTATION")
            this.implementation = value;
        if (tag.toUpperCase() == "SASL")
            this.sasl = value;
        if (tag.toUpperCase() == "SIEVE")
            this.extensions = value;
    }
        
    this.superior = new SieveAbstractResponse(parser);
}

SieveInitResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveInitResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveInitResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveInitResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }

SieveInitResponse.prototype.getImplementation
    = function () { return this.implementation; }

SieveInitResponse.prototype.getSasl
    = function () { return this.sasl; }
    
SieveInitResponse.prototype.getExtensions
    = function () { return this.extensions; }
    
SieveInitResponse.prototype.getTLS
    = function () { return this.tls; }    
    
//*************************************
//*************************************

/*********************************************************
    literal               = "{" number  "+}" CRLF *OCTET
    quoted                = <"> *1024QUOTED-CHAR <">
    response-getscript    = [string CRLF] response-oknobye
    string                = quoted / literal
**********************************************************/

function SieveGetScriptResponse(scriptName,data)
{
	this.scriptName = scriptName;

    var parser = new SieveResponseParser(data);
    
    if (parser.isString())
    {
        this.scriptBody = parser.extractString();
        parser.extractLineBreak();
    }
	
    this.superior = new SieveAbstractResponse(parser);
}

SieveGetScriptResponse.prototype.getMessage
    = function (){ return this.superior.getMessage(); }
    
SieveGetScriptResponse.prototype.hasError
    = function () { return this.superior.hasError(); }

SieveGetScriptResponse.prototype.getResponse
    = function () { return this.superior.getResponse(); }

SieveGetScriptResponse.prototype.getResponseCode
    = function () { return this.superior.getResponseCode(); }
    
SieveGetScriptResponse.prototype.getScriptBody
    = function () { return this.scriptBody; }
    
SieveGetScriptResponse.prototype.getScriptName
    = function () { return this.scriptName; }        