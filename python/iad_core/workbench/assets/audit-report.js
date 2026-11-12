"use strict";(()=>{var qg=Object.create;var Js=Object.defineProperty;var Wg=Object.getOwnPropertyDescriptor;var Kg=Object.getOwnPropertyNames;var $g=Object.getPrototypeOf,Yg=Object.prototype.hasOwnProperty;var lt=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(i){throw t=0,i}};var Xg=(e,t,i,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of Kg(t))!Yg.call(e,r)&&r!==i&&Js(e,r,{get:()=>t[r],enumerable:!(n=Wg(t,r))||n.enumerable});return e};var I=(e,t,i)=>(i=e!=null?qg($g(e)):{},Xg(t||!e||!e.__esModule?Js(i,"default",{value:e,enumerable:!0}):i,e));var ud=lt(O=>{"use strict";var an=Symbol.for("react.element"),Zg=Symbol.for("react.portal"),Jg=Symbol.for("react.fragment"),em=Symbol.for("react.strict_mode"),tm=Symbol.for("react.profiler"),im=Symbol.for("react.provider"),nm=Symbol.for("react.context"),rm=Symbol.for("react.forward_ref"),am=Symbol.for("react.suspense"),om=Symbol.for("react.memo"),lm=Symbol.for("react.lazy"),ed=Symbol.iterator;function sm(e){return e===null||typeof e!="object"?null:(e=ed&&e[ed]||e["@@iterator"],typeof e=="function"?e:null)}var nd={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},rd=Object.assign,ad={};function hi(e,t,i){this.props=e,this.context=t,this.refs=ad,this.updater=i||nd}hi.prototype.isReactComponent={};hi.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};hi.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function od(){}od.prototype=hi.prototype;function ao(e,t,i){this.props=e,this.context=t,this.refs=ad,this.updater=i||nd}var oo=ao.prototype=new od;oo.constructor=ao;rd(oo,hi.prototype);oo.isPureReactComponent=!0;var td=Array.isArray,ld=Object.prototype.hasOwnProperty,lo={current:null},sd={key:!0,ref:!0,__self:!0,__source:!0};function dd(e,t,i){var n,r={},a=null,o=null;if(t!=null)for(n in t.ref!==void 0&&(o=t.ref),t.key!==void 0&&(a=""+t.key),t)ld.call(t,n)&&!sd.hasOwnProperty(n)&&(r[n]=t[n]);var s=arguments.length-2;if(s===1)r.children=i;else if(1<s){for(var l=Array(s),d=0;d<s;d++)l[d]=arguments[d+2];r.children=l}if(e&&e.defaultProps)for(n in s=e.defaultProps,s)r[n]===void 0&&(r[n]=s[n]);return{$$typeof:an,type:e,key:a,ref:o,props:r,_owner:lo.current}}function dm(e,t){return{$$typeof:an,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function so(e){return typeof e=="object"&&e!==null&&e.$$typeof===an}function pm(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(i){return t[i]})}var id=/\/+/g;function ro(e,t){return typeof e=="object"&&e!==null&&e.key!=null?pm(""+e.key):t.toString(36)}function gr(e,t,i,n,r){var a=typeof e;(a==="undefined"||a==="boolean")&&(e=null);var o=!1;if(e===null)o=!0;else switch(a){case"string":case"number":o=!0;break;case"object":switch(e.$$typeof){case an:case Zg:o=!0}}if(o)return o=e,r=r(o),e=n===""?"."+ro(o,0):n,td(r)?(i="",e!=null&&(i=e.replace(id,"$&/")+"/"),gr(r,t,i,"",function(d){return d})):r!=null&&(so(r)&&(r=dm(r,i+(!r.key||o&&o.key===r.key?"":(""+r.key).replace(id,"$&/")+"/")+e)),t.push(r)),1;if(o=0,n=n===""?".":n+":",td(e))for(var s=0;s<e.length;s++){a=e[s];var l=n+ro(a,s);o+=gr(a,t,i,l,r)}else if(l=sm(e),typeof l=="function")for(e=l.call(e),s=0;!(a=e.next()).done;)a=a.value,l=n+ro(a,s++),o+=gr(a,t,i,l,r);else if(a==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return o}function fr(e,t,i){if(e==null)return e;var n=[],r=0;return gr(e,n,"","",function(a){return t.call(i,a,r++)}),n}function um(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(i){(e._status===0||e._status===-1)&&(e._status=1,e._result=i)},function(i){(e._status===0||e._status===-1)&&(e._status=2,e._result=i)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var ge={current:null},mr={transition:null},cm={ReactCurrentDispatcher:ge,ReactCurrentBatchConfig:mr,ReactCurrentOwner:lo};function pd(){throw Error("act(...) is not supported in production builds of React.")}O.Children={map:fr,forEach:function(e,t,i){fr(e,function(){t.apply(this,arguments)},i)},count:function(e){var t=0;return fr(e,function(){t++}),t},toArray:function(e){return fr(e,function(t){return t})||[]},only:function(e){if(!so(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};O.Component=hi;O.Fragment=Jg;O.Profiler=tm;O.PureComponent=ao;O.StrictMode=em;O.Suspense=am;O.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=cm;O.act=pd;O.cloneElement=function(e,t,i){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var n=rd({},e.props),r=e.key,a=e.ref,o=e._owner;if(t!=null){if(t.ref!==void 0&&(a=t.ref,o=lo.current),t.key!==void 0&&(r=""+t.key),e.type&&e.type.defaultProps)var s=e.type.defaultProps;for(l in t)ld.call(t,l)&&!sd.hasOwnProperty(l)&&(n[l]=t[l]===void 0&&s!==void 0?s[l]:t[l])}var l=arguments.length-2;if(l===1)n.children=i;else if(1<l){s=Array(l);for(var d=0;d<l;d++)s[d]=arguments[d+2];n.children=s}return{$$typeof:an,type:e.type,key:r,ref:a,props:n,_owner:o}};O.createContext=function(e){return e={$$typeof:nm,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:im,_context:e},e.Consumer=e};O.createElement=dd;O.createFactory=function(e){var t=dd.bind(null,e);return t.type=e,t};O.createRef=function(){return{current:null}};O.forwardRef=function(e){return{$$typeof:rm,render:e}};O.isValidElement=so;O.lazy=function(e){return{$$typeof:lm,_payload:{_status:-1,_result:e},_init:um}};O.memo=function(e,t){return{$$typeof:om,type:e,compare:t===void 0?null:t}};O.startTransition=function(e){var t=mr.transition;mr.transition={};try{e()}finally{mr.transition=t}};O.unstable_act=pd;O.useCallback=function(e,t){return ge.current.useCallback(e,t)};O.useContext=function(e){return ge.current.useContext(e)};O.useDebugValue=function(){};O.useDeferredValue=function(e){return ge.current.useDeferredValue(e)};O.useEffect=function(e,t){return ge.current.useEffect(e,t)};O.useId=function(){return ge.current.useId()};O.useImperativeHandle=function(e,t,i){return ge.current.useImperativeHandle(e,t,i)};O.useInsertionEffect=function(e,t){return ge.current.useInsertionEffect(e,t)};O.useLayoutEffect=function(e,t){return ge.current.useLayoutEffect(e,t)};O.useMemo=function(e,t){return ge.current.useMemo(e,t)};O.useReducer=function(e,t,i){return ge.current.useReducer(e,t,i)};O.useRef=function(e){return ge.current.useRef(e)};O.useState=function(e){return ge.current.useState(e)};O.useSyncExternalStore=function(e,t,i){return ge.current.useSyncExternalStore(e,t,i)};O.useTransition=function(){return ge.current.useTransition()};O.version="18.3.1"});var V=lt((Yx,cd)=>{"use strict";cd.exports=ud()});var kd=lt(U=>{"use strict";function fo(e,t){var i=e.length;e.push(t);e:for(;0<i;){var n=i-1>>>1,r=e[n];if(0<hr(r,t))e[n]=t,e[i]=r,i=n;else break e}}function De(e){return e.length===0?null:e[0]}function vr(e){if(e.length===0)return null;var t=e[0],i=e.pop();if(i!==t){e[0]=i;e:for(var n=0,r=e.length,a=r>>>1;n<a;){var o=2*(n+1)-1,s=e[o],l=o+1,d=e[l];if(0>hr(s,i))l<r&&0>hr(d,s)?(e[n]=d,e[l]=i,n=l):(e[n]=s,e[o]=i,n=o);else if(l<r&&0>hr(d,i))e[n]=d,e[l]=i,n=l;else break e}}return t}function hr(e,t){var i=e.sortIndex-t.sortIndex;return i!==0?i:e.id-t.id}typeof performance=="object"&&typeof performance.now=="function"?(fd=performance,U.unstable_now=function(){return fd.now()}):(po=Date,gd=po.now(),U.unstable_now=function(){return po.now()-gd});var fd,po,gd,Ke=[],bt=[],fm=1,Re=null,de=3,yr=!1,Yt=!1,ln=!1,xd=typeof setTimeout=="function"?setTimeout:null,vd=typeof clearTimeout=="function"?clearTimeout:null,md=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function go(e){for(var t=De(bt);t!==null;){if(t.callback===null)vr(bt);else if(t.startTime<=e)vr(bt),t.sortIndex=t.expirationTime,fo(Ke,t);else break;t=De(bt)}}function mo(e){if(ln=!1,go(e),!Yt)if(De(Ke)!==null)Yt=!0,xo(ho);else{var t=De(bt);t!==null&&vo(mo,t.startTime-e)}}function ho(e,t){Yt=!1,ln&&(ln=!1,vd(sn),sn=-1),yr=!0;var i=de;try{for(go(t),Re=De(Ke);Re!==null&&(!(Re.expirationTime>t)||e&&!wd());){var n=Re.callback;if(typeof n=="function"){Re.callback=null,de=Re.priorityLevel;var r=n(Re.expirationTime<=t);t=U.unstable_now(),typeof r=="function"?Re.callback=r:Re===De(Ke)&&vr(Ke),go(t)}else vr(Ke);Re=De(Ke)}if(Re!==null)var a=!0;else{var o=De(bt);o!==null&&vo(mo,o.startTime-t),a=!1}return a}finally{Re=null,de=i,yr=!1}}var br=!1,xr=null,sn=-1,yd=5,bd=-1;function wd(){return!(U.unstable_now()-bd<yd)}function uo(){if(xr!==null){var e=U.unstable_now();bd=e;var t=!0;try{t=xr(!0,e)}finally{t?on():(br=!1,xr=null)}}else br=!1}var on;typeof md=="function"?on=function(){md(uo)}:typeof MessageChannel<"u"?(co=new MessageChannel,hd=co.port2,co.port1.onmessage=uo,on=function(){hd.postMessage(null)}):on=function(){xd(uo,0)};var co,hd;function xo(e){xr=e,br||(br=!0,on())}function vo(e,t){sn=xd(function(){e(U.unstable_now())},t)}U.unstable_IdlePriority=5;U.unstable_ImmediatePriority=1;U.unstable_LowPriority=4;U.unstable_NormalPriority=3;U.unstable_Profiling=null;U.unstable_UserBlockingPriority=2;U.unstable_cancelCallback=function(e){e.callback=null};U.unstable_continueExecution=function(){Yt||yr||(Yt=!0,xo(ho))};U.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):yd=0<e?Math.floor(1e3/e):5};U.unstable_getCurrentPriorityLevel=function(){return de};U.unstable_getFirstCallbackNode=function(){return De(Ke)};U.unstable_next=function(e){switch(de){case 1:case 2:case 3:var t=3;break;default:t=de}var i=de;de=t;try{return e()}finally{de=i}};U.unstable_pauseExecution=function(){};U.unstable_requestPaint=function(){};U.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var i=de;de=e;try{return t()}finally{de=i}};U.unstable_scheduleCallback=function(e,t,i){var n=U.unstable_now();switch(typeof i=="object"&&i!==null?(i=i.delay,i=typeof i=="number"&&0<i?n+i:n):i=n,e){case 1:var r=-1;break;case 2:r=250;break;case 5:r=1073741823;break;case 4:r=1e4;break;default:r=5e3}return r=i+r,e={id:fm++,callback:t,priorityLevel:e,startTime:i,expirationTime:r,sortIndex:-1},i>n?(e.sortIndex=i,fo(bt,e),De(Ke)===null&&e===De(bt)&&(ln?(vd(sn),sn=-1):ln=!0,vo(mo,i-n))):(e.sortIndex=r,fo(Ke,e),Yt||yr||(Yt=!0,xo(ho))),e};U.unstable_shouldYield=wd;U.unstable_wrapCallback=function(e){var t=de;return function(){var i=de;de=t;try{return e.apply(this,arguments)}finally{de=i}}}});var Id=lt((Zx,Sd)=>{"use strict";Sd.exports=kd()});var Nc=lt(Ne=>{"use strict";var gm=V(),_e=Id();function w(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,i=1;i<arguments.length;i++)t+="&args[]="+encodeURIComponent(arguments[i]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Pp=new Set,Rn={};function di(e,t){Mi(e,t),Mi(e+"Capture",t)}function Mi(e,t){for(Rn[e]=t,e=0;e<t.length;e++)Pp.add(t[e])}var ft=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Bo=Object.prototype.hasOwnProperty,mm=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,Ed={},_d={};function hm(e){return Bo.call(_d,e)?!0:Bo.call(Ed,e)?!1:mm.test(e)?_d[e]=!0:(Ed[e]=!0,!1)}function xm(e,t,i,n){if(i!==null&&i.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return n?!1:i!==null?!i.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function vm(e,t,i,n){if(t===null||typeof t>"u"||xm(e,t,i,n))return!0;if(n)return!1;if(i!==null)switch(i.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function xe(e,t,i,n,r,a,o){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=n,this.attributeNamespace=r,this.mustUseProperty=i,this.propertyName=e,this.type=t,this.sanitizeURL=a,this.removeEmptyString=o}var se={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){se[e]=new xe(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];se[t]=new xe(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){se[e]=new xe(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){se[e]=new xe(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){se[e]=new xe(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){se[e]=new xe(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){se[e]=new xe(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){se[e]=new xe(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){se[e]=new xe(e,5,!1,e.toLowerCase(),null,!1,!1)});var Tl=/[\-:]([a-z])/g;function Ol(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(Tl,Ol);se[t]=new xe(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(Tl,Ol);se[t]=new xe(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(Tl,Ol);se[t]=new xe(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){se[e]=new xe(e,1,!1,e.toLowerCase(),null,!1,!1)});se.xlinkHref=new xe("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){se[e]=new xe(e,1,!1,e.toLowerCase(),null,!0,!0)});function jl(e,t,i,n){var r=se.hasOwnProperty(t)?se[t]:null;(r!==null?r.type!==0:n||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(vm(t,i,r,n)&&(i=null),n||r===null?hm(t)&&(i===null?e.removeAttribute(t):e.setAttribute(t,""+i)):r.mustUseProperty?e[r.propertyName]=i===null?r.type===3?!1:"":i:(t=r.attributeName,n=r.attributeNamespace,i===null?e.removeAttribute(t):(r=r.type,i=r===3||r===4&&i===!0?"":""+i,n?e.setAttributeNS(n,t,i):e.setAttribute(t,i))))}var xt=gm.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,wr=Symbol.for("react.element"),yi=Symbol.for("react.portal"),bi=Symbol.for("react.fragment"),Al=Symbol.for("react.strict_mode"),Vo=Symbol.for("react.profiler"),Lp=Symbol.for("react.provider"),Tp=Symbol.for("react.context"),Ml=Symbol.for("react.forward_ref"),Ho=Symbol.for("react.suspense"),Qo=Symbol.for("react.suspense_list"),Dl=Symbol.for("react.memo"),kt=Symbol.for("react.lazy"),Op=Symbol.for("react.offscreen"),Cd=Symbol.iterator;function dn(e){return e===null||typeof e!="object"?null:(e=Cd&&e[Cd]||e["@@iterator"],typeof e=="function"?e:null)}var Y=Object.assign,yo;function xn(e){if(yo===void 0)try{throw Error()}catch(i){var t=i.stack.trim().match(/\n( *(at )?)/);yo=t&&t[1]||""}return`
`+yo+e}var bo=!1;function wo(e,t){if(!e||bo)return"";bo=!0;var i=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(d){var n=d}Reflect.construct(e,[],t)}else{try{t.call()}catch(d){n=d}e.call(t.prototype)}else{try{throw Error()}catch(d){n=d}e()}}catch(d){if(d&&n&&typeof d.stack=="string"){for(var r=d.stack.split(`
`),a=n.stack.split(`
`),o=r.length-1,s=a.length-1;1<=o&&0<=s&&r[o]!==a[s];)s--;for(;1<=o&&0<=s;o--,s--)if(r[o]!==a[s]){if(o!==1||s!==1)do if(o--,s--,0>s||r[o]!==a[s]){var l=`
`+r[o].replace(" at new "," at ");return e.displayName&&l.includes("<anonymous>")&&(l=l.replace("<anonymous>",e.displayName)),l}while(1<=o&&0<=s);break}}}finally{bo=!1,Error.prepareStackTrace=i}return(e=e?e.displayName||e.name:"")?xn(e):""}function ym(e){switch(e.tag){case 5:return xn(e.type);case 16:return xn("Lazy");case 13:return xn("Suspense");case 19:return xn("SuspenseList");case 0:case 2:case 15:return e=wo(e.type,!1),e;case 11:return e=wo(e.type.render,!1),e;case 1:return e=wo(e.type,!0),e;default:return""}}function Go(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case bi:return"Fragment";case yi:return"Portal";case Vo:return"Profiler";case Al:return"StrictMode";case Ho:return"Suspense";case Qo:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Tp:return(e.displayName||"Context")+".Consumer";case Lp:return(e._context.displayName||"Context")+".Provider";case Ml:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Dl:return t=e.displayName||null,t!==null?t:Go(e.type)||"Memo";case kt:t=e._payload,e=e._init;try{return Go(e(t))}catch{}}return null}function bm(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Go(t);case 8:return t===Al?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function At(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function jp(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function wm(e){var t=jp(e)?"checked":"value",i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),n=""+e[t];if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var r=i.get,a=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return r.call(this)},set:function(o){n=""+o,a.call(this,o)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return n},setValue:function(o){n=""+o},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function kr(e){e._valueTracker||(e._valueTracker=wm(e))}function Ap(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var i=t.getValue(),n="";return e&&(n=jp(e)?e.checked?"true":"false":e.value),e=n,e!==i?(t.setValue(e),!0):!1}function Yr(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function qo(e,t){var i=t.checked;return Y({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:i??e._wrapperState.initialChecked})}function Nd(e,t){var i=t.defaultValue==null?"":t.defaultValue,n=t.checked!=null?t.checked:t.defaultChecked;i=At(t.value!=null?t.value:i),e._wrapperState={initialChecked:n,initialValue:i,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function Mp(e,t){t=t.checked,t!=null&&jl(e,"checked",t,!1)}function Wo(e,t){Mp(e,t);var i=At(t.value),n=t.type;if(i!=null)n==="number"?(i===0&&e.value===""||e.value!=i)&&(e.value=""+i):e.value!==""+i&&(e.value=""+i);else if(n==="submit"||n==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?Ko(e,t.type,i):t.hasOwnProperty("defaultValue")&&Ko(e,t.type,At(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function zd(e,t,i){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var n=t.type;if(!(n!=="submit"&&n!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,i||t===e.value||(e.value=t),e.defaultValue=t}i=e.name,i!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,i!==""&&(e.name=i)}function Ko(e,t,i){(t!=="number"||Yr(e.ownerDocument)!==e)&&(i==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+i&&(e.defaultValue=""+i))}var vn=Array.isArray;function Pi(e,t,i,n){if(e=e.options,t){t={};for(var r=0;r<i.length;r++)t["$"+i[r]]=!0;for(i=0;i<e.length;i++)r=t.hasOwnProperty("$"+e[i].value),e[i].selected!==r&&(e[i].selected=r),r&&n&&(e[i].defaultSelected=!0)}else{for(i=""+At(i),t=null,r=0;r<e.length;r++){if(e[r].value===i){e[r].selected=!0,n&&(e[r].defaultSelected=!0);return}t!==null||e[r].disabled||(t=e[r])}t!==null&&(t.selected=!0)}}function $o(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(w(91));return Y({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function Rd(e,t){var i=t.value;if(i==null){if(i=t.children,t=t.defaultValue,i!=null){if(t!=null)throw Error(w(92));if(vn(i)){if(1<i.length)throw Error(w(93));i=i[0]}t=i}t==null&&(t=""),i=t}e._wrapperState={initialValue:At(i)}}function Dp(e,t){var i=At(t.value),n=At(t.defaultValue);i!=null&&(i=""+i,i!==e.value&&(e.value=i),t.defaultValue==null&&e.defaultValue!==i&&(e.defaultValue=i)),n!=null&&(e.defaultValue=""+n)}function Pd(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function Fp(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Yo(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?Fp(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var Sr,Up=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,i,n,r){MSApp.execUnsafeLocalFunction(function(){return e(t,i,n,r)})}:e})(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(Sr=Sr||document.createElement("div"),Sr.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=Sr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Pn(e,t){if(t){var i=e.firstChild;if(i&&i===e.lastChild&&i.nodeType===3){i.nodeValue=t;return}}e.textContent=t}var wn={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},km=["Webkit","ms","Moz","O"];Object.keys(wn).forEach(function(e){km.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),wn[t]=wn[e]})});function Bp(e,t,i){return t==null||typeof t=="boolean"||t===""?"":i||typeof t!="number"||t===0||wn.hasOwnProperty(e)&&wn[e]?(""+t).trim():t+"px"}function Vp(e,t){e=e.style;for(var i in t)if(t.hasOwnProperty(i)){var n=i.indexOf("--")===0,r=Bp(i,t[i],n);i==="float"&&(i="cssFloat"),n?e.setProperty(i,r):e[i]=r}}var Sm=Y({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function Xo(e,t){if(t){if(Sm[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(w(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(w(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(w(61))}if(t.style!=null&&typeof t.style!="object")throw Error(w(62))}}function Zo(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Jo=null;function Fl(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var el=null,Li=null,Ti=null;function Ld(e){if(e=$n(e)){if(typeof el!="function")throw Error(w(280));var t=e.stateNode;t&&(t=Ia(t),el(e.stateNode,e.type,t))}}function Hp(e){Li?Ti?Ti.push(e):Ti=[e]:Li=e}function Qp(){if(Li){var e=Li,t=Ti;if(Ti=Li=null,Ld(e),t)for(e=0;e<t.length;e++)Ld(t[e])}}function Gp(e,t){return e(t)}function qp(){}var ko=!1;function Wp(e,t,i){if(ko)return e(t,i);ko=!0;try{return Gp(e,t,i)}finally{ko=!1,(Li!==null||Ti!==null)&&(qp(),Qp())}}function Ln(e,t){var i=e.stateNode;if(i===null)return null;var n=Ia(i);if(n===null)return null;i=n[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(n=!n.disabled)||(e=e.type,n=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!n;break e;default:e=!1}if(e)return null;if(i&&typeof i!="function")throw Error(w(231,t,typeof i));return i}var tl=!1;if(ft)try{xi={},Object.defineProperty(xi,"passive",{get:function(){tl=!0}}),window.addEventListener("test",xi,xi),window.removeEventListener("test",xi,xi)}catch{tl=!1}var xi;function Im(e,t,i,n,r,a,o,s,l){var d=Array.prototype.slice.call(arguments,3);try{t.apply(i,d)}catch(c){this.onError(c)}}var kn=!1,Xr=null,Zr=!1,il=null,Em={onError:function(e){kn=!0,Xr=e}};function _m(e,t,i,n,r,a,o,s,l){kn=!1,Xr=null,Im.apply(Em,arguments)}function Cm(e,t,i,n,r,a,o,s,l){if(_m.apply(this,arguments),kn){if(kn){var d=Xr;kn=!1,Xr=null}else throw Error(w(198));Zr||(Zr=!0,il=d)}}function pi(e){var t=e,i=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(i=t.return),e=t.return;while(e)}return t.tag===3?i:null}function Kp(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Td(e){if(pi(e)!==e)throw Error(w(188))}function Nm(e){var t=e.alternate;if(!t){if(t=pi(e),t===null)throw Error(w(188));return t!==e?null:e}for(var i=e,n=t;;){var r=i.return;if(r===null)break;var a=r.alternate;if(a===null){if(n=r.return,n!==null){i=n;continue}break}if(r.child===a.child){for(a=r.child;a;){if(a===i)return Td(r),e;if(a===n)return Td(r),t;a=a.sibling}throw Error(w(188))}if(i.return!==n.return)i=r,n=a;else{for(var o=!1,s=r.child;s;){if(s===i){o=!0,i=r,n=a;break}if(s===n){o=!0,n=r,i=a;break}s=s.sibling}if(!o){for(s=a.child;s;){if(s===i){o=!0,i=a,n=r;break}if(s===n){o=!0,n=a,i=r;break}s=s.sibling}if(!o)throw Error(w(189))}}if(i.alternate!==n)throw Error(w(190))}if(i.tag!==3)throw Error(w(188));return i.stateNode.current===i?e:t}function $p(e){return e=Nm(e),e!==null?Yp(e):null}function Yp(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=Yp(e);if(t!==null)return t;e=e.sibling}return null}var Xp=_e.unstable_scheduleCallback,Od=_e.unstable_cancelCallback,zm=_e.unstable_shouldYield,Rm=_e.unstable_requestPaint,J=_e.unstable_now,Pm=_e.unstable_getCurrentPriorityLevel,Ul=_e.unstable_ImmediatePriority,Zp=_e.unstable_UserBlockingPriority,Jr=_e.unstable_NormalPriority,Lm=_e.unstable_LowPriority,Jp=_e.unstable_IdlePriority,ba=null,Ze=null;function Tm(e){if(Ze&&typeof Ze.onCommitFiberRoot=="function")try{Ze.onCommitFiberRoot(ba,e,void 0,(e.current.flags&128)===128)}catch{}}var He=Math.clz32?Math.clz32:Am,Om=Math.log,jm=Math.LN2;function Am(e){return e>>>=0,e===0?32:31-(Om(e)/jm|0)|0}var Ir=64,Er=4194304;function yn(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function ea(e,t){var i=e.pendingLanes;if(i===0)return 0;var n=0,r=e.suspendedLanes,a=e.pingedLanes,o=i&268435455;if(o!==0){var s=o&~r;s!==0?n=yn(s):(a&=o,a!==0&&(n=yn(a)))}else o=i&~r,o!==0?n=yn(o):a!==0&&(n=yn(a));if(n===0)return 0;if(t!==0&&t!==n&&(t&r)===0&&(r=n&-n,a=t&-t,r>=a||r===16&&(a&4194240)!==0))return t;if((n&4)!==0&&(n|=i&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=n;0<t;)i=31-He(t),r=1<<i,n|=e[i],t&=~r;return n}function Mm(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Dm(e,t){for(var i=e.suspendedLanes,n=e.pingedLanes,r=e.expirationTimes,a=e.pendingLanes;0<a;){var o=31-He(a),s=1<<o,l=r[o];l===-1?((s&i)===0||(s&n)!==0)&&(r[o]=Mm(s,t)):l<=t&&(e.expiredLanes|=s),a&=~s}}function nl(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function eu(){var e=Ir;return Ir<<=1,(Ir&4194240)===0&&(Ir=64),e}function So(e){for(var t=[],i=0;31>i;i++)t.push(e);return t}function Wn(e,t,i){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-He(t),e[t]=i}function Fm(e,t){var i=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var n=e.eventTimes;for(e=e.expirationTimes;0<i;){var r=31-He(i),a=1<<r;t[r]=0,n[r]=-1,e[r]=-1,i&=~a}}function Bl(e,t){var i=e.entangledLanes|=t;for(e=e.entanglements;i;){var n=31-He(i),r=1<<n;r&t|e[n]&t&&(e[n]|=t),i&=~r}}var D=0;function tu(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var iu,Vl,nu,ru,au,rl=!1,_r=[],Nt=null,zt=null,Rt=null,Tn=new Map,On=new Map,It=[],Um="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function jd(e,t){switch(e){case"focusin":case"focusout":Nt=null;break;case"dragenter":case"dragleave":zt=null;break;case"mouseover":case"mouseout":Rt=null;break;case"pointerover":case"pointerout":Tn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":On.delete(t.pointerId)}}function pn(e,t,i,n,r,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:i,eventSystemFlags:n,nativeEvent:a,targetContainers:[r]},t!==null&&(t=$n(t),t!==null&&Vl(t)),e):(e.eventSystemFlags|=n,t=e.targetContainers,r!==null&&t.indexOf(r)===-1&&t.push(r),e)}function Bm(e,t,i,n,r){switch(t){case"focusin":return Nt=pn(Nt,e,t,i,n,r),!0;case"dragenter":return zt=pn(zt,e,t,i,n,r),!0;case"mouseover":return Rt=pn(Rt,e,t,i,n,r),!0;case"pointerover":var a=r.pointerId;return Tn.set(a,pn(Tn.get(a)||null,e,t,i,n,r)),!0;case"gotpointercapture":return a=r.pointerId,On.set(a,pn(On.get(a)||null,e,t,i,n,r)),!0}return!1}function ou(e){var t=Jt(e.target);if(t!==null){var i=pi(t);if(i!==null){if(t=i.tag,t===13){if(t=Kp(i),t!==null){e.blockedOn=t,au(e.priority,function(){nu(i)});return}}else if(t===3&&i.stateNode.current.memoizedState.isDehydrated){e.blockedOn=i.tag===3?i.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Ur(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var i=al(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(i===null){i=e.nativeEvent;var n=new i.constructor(i.type,i);Jo=n,i.target.dispatchEvent(n),Jo=null}else return t=$n(i),t!==null&&Vl(t),e.blockedOn=i,!1;t.shift()}return!0}function Ad(e,t,i){Ur(e)&&i.delete(t)}function Vm(){rl=!1,Nt!==null&&Ur(Nt)&&(Nt=null),zt!==null&&Ur(zt)&&(zt=null),Rt!==null&&Ur(Rt)&&(Rt=null),Tn.forEach(Ad),On.forEach(Ad)}function un(e,t){e.blockedOn===t&&(e.blockedOn=null,rl||(rl=!0,_e.unstable_scheduleCallback(_e.unstable_NormalPriority,Vm)))}function jn(e){function t(r){return un(r,e)}if(0<_r.length){un(_r[0],e);for(var i=1;i<_r.length;i++){var n=_r[i];n.blockedOn===e&&(n.blockedOn=null)}}for(Nt!==null&&un(Nt,e),zt!==null&&un(zt,e),Rt!==null&&un(Rt,e),Tn.forEach(t),On.forEach(t),i=0;i<It.length;i++)n=It[i],n.blockedOn===e&&(n.blockedOn=null);for(;0<It.length&&(i=It[0],i.blockedOn===null);)ou(i),i.blockedOn===null&&It.shift()}var Oi=xt.ReactCurrentBatchConfig,ta=!0;function Hm(e,t,i,n){var r=D,a=Oi.transition;Oi.transition=null;try{D=1,Hl(e,t,i,n)}finally{D=r,Oi.transition=a}}function Qm(e,t,i,n){var r=D,a=Oi.transition;Oi.transition=null;try{D=4,Hl(e,t,i,n)}finally{D=r,Oi.transition=a}}function Hl(e,t,i,n){if(ta){var r=al(e,t,i,n);if(r===null)Ro(e,t,n,ia,i),jd(e,n);else if(Bm(r,e,t,i,n))n.stopPropagation();else if(jd(e,n),t&4&&-1<Um.indexOf(e)){for(;r!==null;){var a=$n(r);if(a!==null&&iu(a),a=al(e,t,i,n),a===null&&Ro(e,t,n,ia,i),a===r)break;r=a}r!==null&&n.stopPropagation()}else Ro(e,t,n,null,i)}}var ia=null;function al(e,t,i,n){if(ia=null,e=Fl(n),e=Jt(e),e!==null)if(t=pi(e),t===null)e=null;else if(i=t.tag,i===13){if(e=Kp(t),e!==null)return e;e=null}else if(i===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return ia=e,null}function lu(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(Pm()){case Ul:return 1;case Zp:return 4;case Jr:case Lm:return 16;case Jp:return 536870912;default:return 16}default:return 16}}var _t=null,Ql=null,Br=null;function su(){if(Br)return Br;var e,t=Ql,i=t.length,n,r="value"in _t?_t.value:_t.textContent,a=r.length;for(e=0;e<i&&t[e]===r[e];e++);var o=i-e;for(n=1;n<=o&&t[i-n]===r[a-n];n++);return Br=r.slice(e,1<n?1-n:void 0)}function Vr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Cr(){return!0}function Md(){return!1}function Ce(e){function t(i,n,r,a,o){this._reactName=i,this._targetInst=r,this.type=n,this.nativeEvent=a,this.target=o,this.currentTarget=null;for(var s in e)e.hasOwnProperty(s)&&(i=e[s],this[s]=i?i(a):a[s]);return this.isDefaultPrevented=(a.defaultPrevented!=null?a.defaultPrevented:a.returnValue===!1)?Cr:Md,this.isPropagationStopped=Md,this}return Y(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var i=this.nativeEvent;i&&(i.preventDefault?i.preventDefault():typeof i.returnValue!="unknown"&&(i.returnValue=!1),this.isDefaultPrevented=Cr)},stopPropagation:function(){var i=this.nativeEvent;i&&(i.stopPropagation?i.stopPropagation():typeof i.cancelBubble!="unknown"&&(i.cancelBubble=!0),this.isPropagationStopped=Cr)},persist:function(){},isPersistent:Cr}),t}var Qi={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Gl=Ce(Qi),Kn=Y({},Qi,{view:0,detail:0}),Gm=Ce(Kn),Io,Eo,cn,wa=Y({},Kn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:ql,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==cn&&(cn&&e.type==="mousemove"?(Io=e.screenX-cn.screenX,Eo=e.screenY-cn.screenY):Eo=Io=0,cn=e),Io)},movementY:function(e){return"movementY"in e?e.movementY:Eo}}),Dd=Ce(wa),qm=Y({},wa,{dataTransfer:0}),Wm=Ce(qm),Km=Y({},Kn,{relatedTarget:0}),_o=Ce(Km),$m=Y({},Qi,{animationName:0,elapsedTime:0,pseudoElement:0}),Ym=Ce($m),Xm=Y({},Qi,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),Zm=Ce(Xm),Jm=Y({},Qi,{data:0}),Fd=Ce(Jm),eh={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},th={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},ih={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function nh(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=ih[e])?!!t[e]:!1}function ql(){return nh}var rh=Y({},Kn,{key:function(e){if(e.key){var t=eh[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Vr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?th[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:ql,charCode:function(e){return e.type==="keypress"?Vr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Vr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),ah=Ce(rh),oh=Y({},wa,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Ud=Ce(oh),lh=Y({},Kn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:ql}),sh=Ce(lh),dh=Y({},Qi,{propertyName:0,elapsedTime:0,pseudoElement:0}),ph=Ce(dh),uh=Y({},wa,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),ch=Ce(uh),fh=[9,13,27,32],Wl=ft&&"CompositionEvent"in window,Sn=null;ft&&"documentMode"in document&&(Sn=document.documentMode);var gh=ft&&"TextEvent"in window&&!Sn,du=ft&&(!Wl||Sn&&8<Sn&&11>=Sn),Bd=" ",Vd=!1;function pu(e,t){switch(e){case"keyup":return fh.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function uu(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var wi=!1;function mh(e,t){switch(e){case"compositionend":return uu(t);case"keypress":return t.which!==32?null:(Vd=!0,Bd);case"textInput":return e=t.data,e===Bd&&Vd?null:e;default:return null}}function hh(e,t){if(wi)return e==="compositionend"||!Wl&&pu(e,t)?(e=su(),Br=Ql=_t=null,wi=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return du&&t.locale!=="ko"?null:t.data;default:return null}}var xh={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Hd(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!xh[e.type]:t==="textarea"}function cu(e,t,i,n){Hp(n),t=na(t,"onChange"),0<t.length&&(i=new Gl("onChange","change",null,i,n),e.push({event:i,listeners:t}))}var In=null,An=null;function vh(e){Su(e,0)}function ka(e){var t=Ii(e);if(Ap(t))return e}function yh(e,t){if(e==="change")return t}var fu=!1;ft&&(ft?(zr="oninput"in document,zr||(Co=document.createElement("div"),Co.setAttribute("oninput","return;"),zr=typeof Co.oninput=="function"),Nr=zr):Nr=!1,fu=Nr&&(!document.documentMode||9<document.documentMode));var Nr,zr,Co;function Qd(){In&&(In.detachEvent("onpropertychange",gu),An=In=null)}function gu(e){if(e.propertyName==="value"&&ka(An)){var t=[];cu(t,An,e,Fl(e)),Wp(vh,t)}}function bh(e,t,i){e==="focusin"?(Qd(),In=t,An=i,In.attachEvent("onpropertychange",gu)):e==="focusout"&&Qd()}function wh(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return ka(An)}function kh(e,t){if(e==="click")return ka(t)}function Sh(e,t){if(e==="input"||e==="change")return ka(t)}function Ih(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Ge=typeof Object.is=="function"?Object.is:Ih;function Mn(e,t){if(Ge(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var i=Object.keys(e),n=Object.keys(t);if(i.length!==n.length)return!1;for(n=0;n<i.length;n++){var r=i[n];if(!Bo.call(t,r)||!Ge(e[r],t[r]))return!1}return!0}function Gd(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function qd(e,t){var i=Gd(e);e=0;for(var n;i;){if(i.nodeType===3){if(n=e+i.textContent.length,e<=t&&n>=t)return{node:i,offset:t-e};e=n}e:{for(;i;){if(i.nextSibling){i=i.nextSibling;break e}i=i.parentNode}i=void 0}i=Gd(i)}}function mu(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?mu(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function hu(){for(var e=window,t=Yr();t instanceof e.HTMLIFrameElement;){try{var i=typeof t.contentWindow.location.href=="string"}catch{i=!1}if(i)e=t.contentWindow;else break;t=Yr(e.document)}return t}function Kl(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function Eh(e){var t=hu(),i=e.focusedElem,n=e.selectionRange;if(t!==i&&i&&i.ownerDocument&&mu(i.ownerDocument.documentElement,i)){if(n!==null&&Kl(i)){if(t=n.start,e=n.end,e===void 0&&(e=t),"selectionStart"in i)i.selectionStart=t,i.selectionEnd=Math.min(e,i.value.length);else if(e=(t=i.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var r=i.textContent.length,a=Math.min(n.start,r);n=n.end===void 0?a:Math.min(n.end,r),!e.extend&&a>n&&(r=n,n=a,a=r),r=qd(i,a);var o=qd(i,n);r&&o&&(e.rangeCount!==1||e.anchorNode!==r.node||e.anchorOffset!==r.offset||e.focusNode!==o.node||e.focusOffset!==o.offset)&&(t=t.createRange(),t.setStart(r.node,r.offset),e.removeAllRanges(),a>n?(e.addRange(t),e.extend(o.node,o.offset)):(t.setEnd(o.node,o.offset),e.addRange(t)))}}for(t=[],e=i;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof i.focus=="function"&&i.focus(),i=0;i<t.length;i++)e=t[i],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var _h=ft&&"documentMode"in document&&11>=document.documentMode,ki=null,ol=null,En=null,ll=!1;function Wd(e,t,i){var n=i.window===i?i.document:i.nodeType===9?i:i.ownerDocument;ll||ki==null||ki!==Yr(n)||(n=ki,"selectionStart"in n&&Kl(n)?n={start:n.selectionStart,end:n.selectionEnd}:(n=(n.ownerDocument&&n.ownerDocument.defaultView||window).getSelection(),n={anchorNode:n.anchorNode,anchorOffset:n.anchorOffset,focusNode:n.focusNode,focusOffset:n.focusOffset}),En&&Mn(En,n)||(En=n,n=na(ol,"onSelect"),0<n.length&&(t=new Gl("onSelect","select",null,t,i),e.push({event:t,listeners:n}),t.target=ki)))}function Rr(e,t){var i={};return i[e.toLowerCase()]=t.toLowerCase(),i["Webkit"+e]="webkit"+t,i["Moz"+e]="moz"+t,i}var Si={animationend:Rr("Animation","AnimationEnd"),animationiteration:Rr("Animation","AnimationIteration"),animationstart:Rr("Animation","AnimationStart"),transitionend:Rr("Transition","TransitionEnd")},No={},xu={};ft&&(xu=document.createElement("div").style,"AnimationEvent"in window||(delete Si.animationend.animation,delete Si.animationiteration.animation,delete Si.animationstart.animation),"TransitionEvent"in window||delete Si.transitionend.transition);function Sa(e){if(No[e])return No[e];if(!Si[e])return e;var t=Si[e],i;for(i in t)if(t.hasOwnProperty(i)&&i in xu)return No[e]=t[i];return e}var vu=Sa("animationend"),yu=Sa("animationiteration"),bu=Sa("animationstart"),wu=Sa("transitionend"),ku=new Map,Kd="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Dt(e,t){ku.set(e,t),di(t,[e])}for(Pr=0;Pr<Kd.length;Pr++)Lr=Kd[Pr],$d=Lr.toLowerCase(),Yd=Lr[0].toUpperCase()+Lr.slice(1),Dt($d,"on"+Yd);var Lr,$d,Yd,Pr;Dt(vu,"onAnimationEnd");Dt(yu,"onAnimationIteration");Dt(bu,"onAnimationStart");Dt("dblclick","onDoubleClick");Dt("focusin","onFocus");Dt("focusout","onBlur");Dt(wu,"onTransitionEnd");Mi("onMouseEnter",["mouseout","mouseover"]);Mi("onMouseLeave",["mouseout","mouseover"]);Mi("onPointerEnter",["pointerout","pointerover"]);Mi("onPointerLeave",["pointerout","pointerover"]);di("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));di("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));di("onBeforeInput",["compositionend","keypress","textInput","paste"]);di("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));di("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));di("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var bn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Ch=new Set("cancel close invalid load scroll toggle".split(" ").concat(bn));function Xd(e,t,i){var n=e.type||"unknown-event";e.currentTarget=i,Cm(n,t,void 0,e),e.currentTarget=null}function Su(e,t){t=(t&4)!==0;for(var i=0;i<e.length;i++){var n=e[i],r=n.event;n=n.listeners;e:{var a=void 0;if(t)for(var o=n.length-1;0<=o;o--){var s=n[o],l=s.instance,d=s.currentTarget;if(s=s.listener,l!==a&&r.isPropagationStopped())break e;Xd(r,s,d),a=l}else for(o=0;o<n.length;o++){if(s=n[o],l=s.instance,d=s.currentTarget,s=s.listener,l!==a&&r.isPropagationStopped())break e;Xd(r,s,d),a=l}}}if(Zr)throw e=il,Zr=!1,il=null,e}function H(e,t){var i=t[cl];i===void 0&&(i=t[cl]=new Set);var n=e+"__bubble";i.has(n)||(Iu(t,e,2,!1),i.add(n))}function zo(e,t,i){var n=0;t&&(n|=4),Iu(i,e,n,t)}var Tr="_reactListening"+Math.random().toString(36).slice(2);function Dn(e){if(!e[Tr]){e[Tr]=!0,Pp.forEach(function(i){i!=="selectionchange"&&(Ch.has(i)||zo(i,!1,e),zo(i,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Tr]||(t[Tr]=!0,zo("selectionchange",!1,t))}}function Iu(e,t,i,n){switch(lu(t)){case 1:var r=Hm;break;case 4:r=Qm;break;default:r=Hl}i=r.bind(null,t,i,e),r=void 0,!tl||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(r=!0),n?r!==void 0?e.addEventListener(t,i,{capture:!0,passive:r}):e.addEventListener(t,i,!0):r!==void 0?e.addEventListener(t,i,{passive:r}):e.addEventListener(t,i,!1)}function Ro(e,t,i,n,r){var a=n;if((t&1)===0&&(t&2)===0&&n!==null)e:for(;;){if(n===null)return;var o=n.tag;if(o===3||o===4){var s=n.stateNode.containerInfo;if(s===r||s.nodeType===8&&s.parentNode===r)break;if(o===4)for(o=n.return;o!==null;){var l=o.tag;if((l===3||l===4)&&(l=o.stateNode.containerInfo,l===r||l.nodeType===8&&l.parentNode===r))return;o=o.return}for(;s!==null;){if(o=Jt(s),o===null)return;if(l=o.tag,l===5||l===6){n=a=o;continue e}s=s.parentNode}}n=n.return}Wp(function(){var d=a,c=Fl(i),g=[];e:{var h=ku.get(e);if(h!==void 0){var v=Gl,b=e;switch(e){case"keypress":if(Vr(i)===0)break e;case"keydown":case"keyup":v=ah;break;case"focusin":b="focus",v=_o;break;case"focusout":b="blur",v=_o;break;case"beforeblur":case"afterblur":v=_o;break;case"click":if(i.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":v=Dd;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":v=Wm;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":v=sh;break;case vu:case yu:case bu:v=Ym;break;case wu:v=ph;break;case"scroll":v=Gm;break;case"wheel":v=ch;break;case"copy":case"cut":case"paste":v=Zm;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":v=Ud}var m=(t&4)!==0,S=!m&&e==="scroll",u=m?h!==null?h+"Capture":null:h;m=[];for(var p=d,f;p!==null;){f=p;var y=f.stateNode;if(f.tag===5&&y!==null&&(f=y,u!==null&&(y=Ln(p,u),y!=null&&m.push(Fn(p,y,f)))),S)break;p=p.return}0<m.length&&(h=new v(h,b,null,i,c),g.push({event:h,listeners:m}))}}if((t&7)===0){e:{if(h=e==="mouseover"||e==="pointerover",v=e==="mouseout"||e==="pointerout",h&&i!==Jo&&(b=i.relatedTarget||i.fromElement)&&(Jt(b)||b[gt]))break e;if((v||h)&&(h=c.window===c?c:(h=c.ownerDocument)?h.defaultView||h.parentWindow:window,v?(b=i.relatedTarget||i.toElement,v=d,b=b?Jt(b):null,b!==null&&(S=pi(b),b!==S||b.tag!==5&&b.tag!==6)&&(b=null)):(v=null,b=d),v!==b)){if(m=Dd,y="onMouseLeave",u="onMouseEnter",p="mouse",(e==="pointerout"||e==="pointerover")&&(m=Ud,y="onPointerLeave",u="onPointerEnter",p="pointer"),S=v==null?h:Ii(v),f=b==null?h:Ii(b),h=new m(y,p+"leave",v,i,c),h.target=S,h.relatedTarget=f,y=null,Jt(c)===d&&(m=new m(u,p+"enter",b,i,c),m.target=f,m.relatedTarget=S,y=m),S=y,v&&b)t:{for(m=v,u=b,p=0,f=m;f;f=vi(f))p++;for(f=0,y=u;y;y=vi(y))f++;for(;0<p-f;)m=vi(m),p--;for(;0<f-p;)u=vi(u),f--;for(;p--;){if(m===u||u!==null&&m===u.alternate)break t;m=vi(m),u=vi(u)}m=null}else m=null;v!==null&&Zd(g,h,v,m,!1),b!==null&&S!==null&&Zd(g,S,b,m,!0)}}e:{if(h=d?Ii(d):window,v=h.nodeName&&h.nodeName.toLowerCase(),v==="select"||v==="input"&&h.type==="file")var k=yh;else if(Hd(h))if(fu)k=Sh;else{k=wh;var E=bh}else(v=h.nodeName)&&v.toLowerCase()==="input"&&(h.type==="checkbox"||h.type==="radio")&&(k=kh);if(k&&(k=k(e,d))){cu(g,k,i,c);break e}E&&E(e,h,d),e==="focusout"&&(E=h._wrapperState)&&E.controlled&&h.type==="number"&&Ko(h,"number",h.value)}switch(E=d?Ii(d):window,e){case"focusin":(Hd(E)||E.contentEditable==="true")&&(ki=E,ol=d,En=null);break;case"focusout":En=ol=ki=null;break;case"mousedown":ll=!0;break;case"contextmenu":case"mouseup":case"dragend":ll=!1,Wd(g,i,c);break;case"selectionchange":if(_h)break;case"keydown":case"keyup":Wd(g,i,c)}var N;if(Wl)e:{switch(e){case"compositionstart":var P="onCompositionStart";break e;case"compositionend":P="onCompositionEnd";break e;case"compositionupdate":P="onCompositionUpdate";break e}P=void 0}else wi?pu(e,i)&&(P="onCompositionEnd"):e==="keydown"&&i.keyCode===229&&(P="onCompositionStart");P&&(du&&i.locale!=="ko"&&(wi||P!=="onCompositionStart"?P==="onCompositionEnd"&&wi&&(N=su()):(_t=c,Ql="value"in _t?_t.value:_t.textContent,wi=!0)),E=na(d,P),0<E.length&&(P=new Fd(P,e,null,i,c),g.push({event:P,listeners:E}),N?P.data=N:(N=uu(i),N!==null&&(P.data=N)))),(N=gh?mh(e,i):hh(e,i))&&(d=na(d,"onBeforeInput"),0<d.length&&(c=new Fd("onBeforeInput","beforeinput",null,i,c),g.push({event:c,listeners:d}),c.data=N))}Su(g,t)})}function Fn(e,t,i){return{instance:e,listener:t,currentTarget:i}}function na(e,t){for(var i=t+"Capture",n=[];e!==null;){var r=e,a=r.stateNode;r.tag===5&&a!==null&&(r=a,a=Ln(e,i),a!=null&&n.unshift(Fn(e,a,r)),a=Ln(e,t),a!=null&&n.push(Fn(e,a,r))),e=e.return}return n}function vi(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function Zd(e,t,i,n,r){for(var a=t._reactName,o=[];i!==null&&i!==n;){var s=i,l=s.alternate,d=s.stateNode;if(l!==null&&l===n)break;s.tag===5&&d!==null&&(s=d,r?(l=Ln(i,a),l!=null&&o.unshift(Fn(i,l,s))):r||(l=Ln(i,a),l!=null&&o.push(Fn(i,l,s)))),i=i.return}o.length!==0&&e.push({event:t,listeners:o})}var Nh=/\r\n?/g,zh=/\u0000|\uFFFD/g;function Jd(e){return(typeof e=="string"?e:""+e).replace(Nh,`
`).replace(zh,"")}function Or(e,t,i){if(t=Jd(t),Jd(e)!==t&&i)throw Error(w(425))}function ra(){}var sl=null,dl=null;function pl(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var ul=typeof setTimeout=="function"?setTimeout:void 0,Rh=typeof clearTimeout=="function"?clearTimeout:void 0,ep=typeof Promise=="function"?Promise:void 0,Ph=typeof queueMicrotask=="function"?queueMicrotask:typeof ep<"u"?function(e){return ep.resolve(null).then(e).catch(Lh)}:ul;function Lh(e){setTimeout(function(){throw e})}function Po(e,t){var i=t,n=0;do{var r=i.nextSibling;if(e.removeChild(i),r&&r.nodeType===8)if(i=r.data,i==="/$"){if(n===0){e.removeChild(r),jn(t);return}n--}else i!=="$"&&i!=="$?"&&i!=="$!"||n++;i=r}while(i);jn(t)}function Pt(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function tp(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var i=e.data;if(i==="$"||i==="$!"||i==="$?"){if(t===0)return e;t--}else i==="/$"&&t++}e=e.previousSibling}return null}var Gi=Math.random().toString(36).slice(2),Xe="__reactFiber$"+Gi,Un="__reactProps$"+Gi,gt="__reactContainer$"+Gi,cl="__reactEvents$"+Gi,Th="__reactListeners$"+Gi,Oh="__reactHandles$"+Gi;function Jt(e){var t=e[Xe];if(t)return t;for(var i=e.parentNode;i;){if(t=i[gt]||i[Xe]){if(i=t.alternate,t.child!==null||i!==null&&i.child!==null)for(e=tp(e);e!==null;){if(i=e[Xe])return i;e=tp(e)}return t}e=i,i=e.parentNode}return null}function $n(e){return e=e[Xe]||e[gt],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Ii(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(w(33))}function Ia(e){return e[Un]||null}var fl=[],Ei=-1;function Ft(e){return{current:e}}function Q(e){0>Ei||(e.current=fl[Ei],fl[Ei]=null,Ei--)}function B(e,t){Ei++,fl[Ei]=e.current,e.current=t}var Mt={},fe=Ft(Mt),be=Ft(!1),ri=Mt;function Di(e,t){var i=e.type.contextTypes;if(!i)return Mt;var n=e.stateNode;if(n&&n.__reactInternalMemoizedUnmaskedChildContext===t)return n.__reactInternalMemoizedMaskedChildContext;var r={},a;for(a in i)r[a]=t[a];return n&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=r),r}function we(e){return e=e.childContextTypes,e!=null}function aa(){Q(be),Q(fe)}function ip(e,t,i){if(fe.current!==Mt)throw Error(w(168));B(fe,t),B(be,i)}function Eu(e,t,i){var n=e.stateNode;if(t=t.childContextTypes,typeof n.getChildContext!="function")return i;n=n.getChildContext();for(var r in n)if(!(r in t))throw Error(w(108,bm(e)||"Unknown",r));return Y({},i,n)}function oa(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Mt,ri=fe.current,B(fe,e),B(be,be.current),!0}function np(e,t,i){var n=e.stateNode;if(!n)throw Error(w(169));i?(e=Eu(e,t,ri),n.__reactInternalMemoizedMergedChildContext=e,Q(be),Q(fe),B(fe,e)):Q(be),B(be,i)}var dt=null,Ea=!1,Lo=!1;function _u(e){dt===null?dt=[e]:dt.push(e)}function jh(e){Ea=!0,_u(e)}function Ut(){if(!Lo&&dt!==null){Lo=!0;var e=0,t=D;try{var i=dt;for(D=1;e<i.length;e++){var n=i[e];do n=n(!0);while(n!==null)}dt=null,Ea=!1}catch(r){throw dt!==null&&(dt=dt.slice(e+1)),Xp(Ul,Ut),r}finally{D=t,Lo=!1}}return null}var _i=[],Ci=0,la=null,sa=0,Pe=[],Le=0,ai=null,pt=1,ut="";function Xt(e,t){_i[Ci++]=sa,_i[Ci++]=la,la=e,sa=t}function Cu(e,t,i){Pe[Le++]=pt,Pe[Le++]=ut,Pe[Le++]=ai,ai=e;var n=pt;e=ut;var r=32-He(n)-1;n&=~(1<<r),i+=1;var a=32-He(t)+r;if(30<a){var o=r-r%5;a=(n&(1<<o)-1).toString(32),n>>=o,r-=o,pt=1<<32-He(t)+r|i<<r|n,ut=a+e}else pt=1<<a|i<<r|n,ut=e}function $l(e){e.return!==null&&(Xt(e,1),Cu(e,1,0))}function Yl(e){for(;e===la;)la=_i[--Ci],_i[Ci]=null,sa=_i[--Ci],_i[Ci]=null;for(;e===ai;)ai=Pe[--Le],Pe[Le]=null,ut=Pe[--Le],Pe[Le]=null,pt=Pe[--Le],Pe[Le]=null}var Ee=null,Ie=null,q=!1,Ve=null;function Nu(e,t){var i=Te(5,null,null,0);i.elementType="DELETED",i.stateNode=t,i.return=e,t=e.deletions,t===null?(e.deletions=[i],e.flags|=16):t.push(i)}function rp(e,t){switch(e.tag){case 5:var i=e.type;return t=t.nodeType!==1||i.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,Ee=e,Ie=Pt(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,Ee=e,Ie=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(i=ai!==null?{id:pt,overflow:ut}:null,e.memoizedState={dehydrated:t,treeContext:i,retryLane:1073741824},i=Te(18,null,null,0),i.stateNode=t,i.return=e,e.child=i,Ee=e,Ie=null,!0):!1;default:return!1}}function gl(e){return(e.mode&1)!==0&&(e.flags&128)===0}function ml(e){if(q){var t=Ie;if(t){var i=t;if(!rp(e,t)){if(gl(e))throw Error(w(418));t=Pt(i.nextSibling);var n=Ee;t&&rp(e,t)?Nu(n,i):(e.flags=e.flags&-4097|2,q=!1,Ee=e)}}else{if(gl(e))throw Error(w(418));e.flags=e.flags&-4097|2,q=!1,Ee=e}}}function ap(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;Ee=e}function jr(e){if(e!==Ee)return!1;if(!q)return ap(e),q=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!pl(e.type,e.memoizedProps)),t&&(t=Ie)){if(gl(e))throw zu(),Error(w(418));for(;t;)Nu(e,t),t=Pt(t.nextSibling)}if(ap(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(w(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var i=e.data;if(i==="/$"){if(t===0){Ie=Pt(e.nextSibling);break e}t--}else i!=="$"&&i!=="$!"&&i!=="$?"||t++}e=e.nextSibling}Ie=null}}else Ie=Ee?Pt(e.stateNode.nextSibling):null;return!0}function zu(){for(var e=Ie;e;)e=Pt(e.nextSibling)}function Fi(){Ie=Ee=null,q=!1}function Xl(e){Ve===null?Ve=[e]:Ve.push(e)}var Ah=xt.ReactCurrentBatchConfig;function fn(e,t,i){if(e=i.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(i._owner){if(i=i._owner,i){if(i.tag!==1)throw Error(w(309));var n=i.stateNode}if(!n)throw Error(w(147,e));var r=n,a=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===a?t.ref:(t=function(o){var s=r.refs;o===null?delete s[a]:s[a]=o},t._stringRef=a,t)}if(typeof e!="string")throw Error(w(284));if(!i._owner)throw Error(w(290,e))}return e}function Ar(e,t){throw e=Object.prototype.toString.call(t),Error(w(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function op(e){var t=e._init;return t(e._payload)}function Ru(e){function t(u,p){if(e){var f=u.deletions;f===null?(u.deletions=[p],u.flags|=16):f.push(p)}}function i(u,p){if(!e)return null;for(;p!==null;)t(u,p),p=p.sibling;return null}function n(u,p){for(u=new Map;p!==null;)p.key!==null?u.set(p.key,p):u.set(p.index,p),p=p.sibling;return u}function r(u,p){return u=jt(u,p),u.index=0,u.sibling=null,u}function a(u,p,f){return u.index=f,e?(f=u.alternate,f!==null?(f=f.index,f<p?(u.flags|=2,p):f):(u.flags|=2,p)):(u.flags|=1048576,p)}function o(u){return e&&u.alternate===null&&(u.flags|=2),u}function s(u,p,f,y){return p===null||p.tag!==6?(p=Fo(f,u.mode,y),p.return=u,p):(p=r(p,f),p.return=u,p)}function l(u,p,f,y){var k=f.type;return k===bi?c(u,p,f.props.children,y,f.key):p!==null&&(p.elementType===k||typeof k=="object"&&k!==null&&k.$$typeof===kt&&op(k)===p.type)?(y=r(p,f.props),y.ref=fn(u,p,f),y.return=u,y):(y=$r(f.type,f.key,f.props,null,u.mode,y),y.ref=fn(u,p,f),y.return=u,y)}function d(u,p,f,y){return p===null||p.tag!==4||p.stateNode.containerInfo!==f.containerInfo||p.stateNode.implementation!==f.implementation?(p=Uo(f,u.mode,y),p.return=u,p):(p=r(p,f.children||[]),p.return=u,p)}function c(u,p,f,y,k){return p===null||p.tag!==7?(p=ni(f,u.mode,y,k),p.return=u,p):(p=r(p,f),p.return=u,p)}function g(u,p,f){if(typeof p=="string"&&p!==""||typeof p=="number")return p=Fo(""+p,u.mode,f),p.return=u,p;if(typeof p=="object"&&p!==null){switch(p.$$typeof){case wr:return f=$r(p.type,p.key,p.props,null,u.mode,f),f.ref=fn(u,null,p),f.return=u,f;case yi:return p=Uo(p,u.mode,f),p.return=u,p;case kt:var y=p._init;return g(u,y(p._payload),f)}if(vn(p)||dn(p))return p=ni(p,u.mode,f,null),p.return=u,p;Ar(u,p)}return null}function h(u,p,f,y){var k=p!==null?p.key:null;if(typeof f=="string"&&f!==""||typeof f=="number")return k!==null?null:s(u,p,""+f,y);if(typeof f=="object"&&f!==null){switch(f.$$typeof){case wr:return f.key===k?l(u,p,f,y):null;case yi:return f.key===k?d(u,p,f,y):null;case kt:return k=f._init,h(u,p,k(f._payload),y)}if(vn(f)||dn(f))return k!==null?null:c(u,p,f,y,null);Ar(u,f)}return null}function v(u,p,f,y,k){if(typeof y=="string"&&y!==""||typeof y=="number")return u=u.get(f)||null,s(p,u,""+y,k);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case wr:return u=u.get(y.key===null?f:y.key)||null,l(p,u,y,k);case yi:return u=u.get(y.key===null?f:y.key)||null,d(p,u,y,k);case kt:var E=y._init;return v(u,p,f,E(y._payload),k)}if(vn(y)||dn(y))return u=u.get(f)||null,c(p,u,y,k,null);Ar(p,y)}return null}function b(u,p,f,y){for(var k=null,E=null,N=p,P=p=0,Z=null;N!==null&&P<f.length;P++){N.index>P?(Z=N,N=null):Z=N.sibling;var T=h(u,N,f[P],y);if(T===null){N===null&&(N=Z);break}e&&N&&T.alternate===null&&t(u,N),p=a(T,p,P),E===null?k=T:E.sibling=T,E=T,N=Z}if(P===f.length)return i(u,N),q&&Xt(u,P),k;if(N===null){for(;P<f.length;P++)N=g(u,f[P],y),N!==null&&(p=a(N,p,P),E===null?k=N:E.sibling=N,E=N);return q&&Xt(u,P),k}for(N=n(u,N);P<f.length;P++)Z=v(N,u,P,f[P],y),Z!==null&&(e&&Z.alternate!==null&&N.delete(Z.key===null?P:Z.key),p=a(Z,p,P),E===null?k=Z:E.sibling=Z,E=Z);return e&&N.forEach(function(Me){return t(u,Me)}),q&&Xt(u,P),k}function m(u,p,f,y){var k=dn(f);if(typeof k!="function")throw Error(w(150));if(f=k.call(f),f==null)throw Error(w(151));for(var E=k=null,N=p,P=p=0,Z=null,T=f.next();N!==null&&!T.done;P++,T=f.next()){N.index>P?(Z=N,N=null):Z=N.sibling;var Me=h(u,N,T.value,y);if(Me===null){N===null&&(N=Z);break}e&&N&&Me.alternate===null&&t(u,N),p=a(Me,p,P),E===null?k=Me:E.sibling=Me,E=Me,N=Z}if(T.done)return i(u,N),q&&Xt(u,P),k;if(N===null){for(;!T.done;P++,T=f.next())T=g(u,T.value,y),T!==null&&(p=a(T,p,P),E===null?k=T:E.sibling=T,E=T);return q&&Xt(u,P),k}for(N=n(u,N);!T.done;P++,T=f.next())T=v(N,u,P,T.value,y),T!==null&&(e&&T.alternate!==null&&N.delete(T.key===null?P:T.key),p=a(T,p,P),E===null?k=T:E.sibling=T,E=T);return e&&N.forEach(function(eo){return t(u,eo)}),q&&Xt(u,P),k}function S(u,p,f,y){if(typeof f=="object"&&f!==null&&f.type===bi&&f.key===null&&(f=f.props.children),typeof f=="object"&&f!==null){switch(f.$$typeof){case wr:e:{for(var k=f.key,E=p;E!==null;){if(E.key===k){if(k=f.type,k===bi){if(E.tag===7){i(u,E.sibling),p=r(E,f.props.children),p.return=u,u=p;break e}}else if(E.elementType===k||typeof k=="object"&&k!==null&&k.$$typeof===kt&&op(k)===E.type){i(u,E.sibling),p=r(E,f.props),p.ref=fn(u,E,f),p.return=u,u=p;break e}i(u,E);break}else t(u,E);E=E.sibling}f.type===bi?(p=ni(f.props.children,u.mode,y,f.key),p.return=u,u=p):(y=$r(f.type,f.key,f.props,null,u.mode,y),y.ref=fn(u,p,f),y.return=u,u=y)}return o(u);case yi:e:{for(E=f.key;p!==null;){if(p.key===E)if(p.tag===4&&p.stateNode.containerInfo===f.containerInfo&&p.stateNode.implementation===f.implementation){i(u,p.sibling),p=r(p,f.children||[]),p.return=u,u=p;break e}else{i(u,p);break}else t(u,p);p=p.sibling}p=Uo(f,u.mode,y),p.return=u,u=p}return o(u);case kt:return E=f._init,S(u,p,E(f._payload),y)}if(vn(f))return b(u,p,f,y);if(dn(f))return m(u,p,f,y);Ar(u,f)}return typeof f=="string"&&f!==""||typeof f=="number"?(f=""+f,p!==null&&p.tag===6?(i(u,p.sibling),p=r(p,f),p.return=u,u=p):(i(u,p),p=Fo(f,u.mode,y),p.return=u,u=p),o(u)):i(u,p)}return S}var Ui=Ru(!0),Pu=Ru(!1),da=Ft(null),pa=null,Ni=null,Zl=null;function Jl(){Zl=Ni=pa=null}function es(e){var t=da.current;Q(da),e._currentValue=t}function hl(e,t,i){for(;e!==null;){var n=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,n!==null&&(n.childLanes|=t)):n!==null&&(n.childLanes&t)!==t&&(n.childLanes|=t),e===i)break;e=e.return}}function ji(e,t){pa=e,Zl=Ni=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&t)!==0&&(ye=!0),e.firstContext=null)}function je(e){var t=e._currentValue;if(Zl!==e)if(e={context:e,memoizedValue:t,next:null},Ni===null){if(pa===null)throw Error(w(308));Ni=e,pa.dependencies={lanes:0,firstContext:e}}else Ni=Ni.next=e;return t}var ei=null;function ts(e){ei===null?ei=[e]:ei.push(e)}function Lu(e,t,i,n){var r=t.interleaved;return r===null?(i.next=i,ts(t)):(i.next=r.next,r.next=i),t.interleaved=i,mt(e,n)}function mt(e,t){e.lanes|=t;var i=e.alternate;for(i!==null&&(i.lanes|=t),i=e,e=e.return;e!==null;)e.childLanes|=t,i=e.alternate,i!==null&&(i.childLanes|=t),i=e,e=e.return;return i.tag===3?i.stateNode:null}var St=!1;function is(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Tu(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function ct(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function Lt(e,t,i){var n=e.updateQueue;if(n===null)return null;if(n=n.shared,(A&2)!==0){var r=n.pending;return r===null?t.next=t:(t.next=r.next,r.next=t),n.pending=t,mt(e,i)}return r=n.interleaved,r===null?(t.next=t,ts(n)):(t.next=r.next,r.next=t),n.interleaved=t,mt(e,i)}function Hr(e,t,i){if(t=t.updateQueue,t!==null&&(t=t.shared,(i&4194240)!==0)){var n=t.lanes;n&=e.pendingLanes,i|=n,t.lanes=i,Bl(e,i)}}function lp(e,t){var i=e.updateQueue,n=e.alternate;if(n!==null&&(n=n.updateQueue,i===n)){var r=null,a=null;if(i=i.firstBaseUpdate,i!==null){do{var o={eventTime:i.eventTime,lane:i.lane,tag:i.tag,payload:i.payload,callback:i.callback,next:null};a===null?r=a=o:a=a.next=o,i=i.next}while(i!==null);a===null?r=a=t:a=a.next=t}else r=a=t;i={baseState:n.baseState,firstBaseUpdate:r,lastBaseUpdate:a,shared:n.shared,effects:n.effects},e.updateQueue=i;return}e=i.lastBaseUpdate,e===null?i.firstBaseUpdate=t:e.next=t,i.lastBaseUpdate=t}function ua(e,t,i,n){var r=e.updateQueue;St=!1;var a=r.firstBaseUpdate,o=r.lastBaseUpdate,s=r.shared.pending;if(s!==null){r.shared.pending=null;var l=s,d=l.next;l.next=null,o===null?a=d:o.next=d,o=l;var c=e.alternate;c!==null&&(c=c.updateQueue,s=c.lastBaseUpdate,s!==o&&(s===null?c.firstBaseUpdate=d:s.next=d,c.lastBaseUpdate=l))}if(a!==null){var g=r.baseState;o=0,c=d=l=null,s=a;do{var h=s.lane,v=s.eventTime;if((n&h)===h){c!==null&&(c=c.next={eventTime:v,lane:0,tag:s.tag,payload:s.payload,callback:s.callback,next:null});e:{var b=e,m=s;switch(h=t,v=i,m.tag){case 1:if(b=m.payload,typeof b=="function"){g=b.call(v,g,h);break e}g=b;break e;case 3:b.flags=b.flags&-65537|128;case 0:if(b=m.payload,h=typeof b=="function"?b.call(v,g,h):b,h==null)break e;g=Y({},g,h);break e;case 2:St=!0}}s.callback!==null&&s.lane!==0&&(e.flags|=64,h=r.effects,h===null?r.effects=[s]:h.push(s))}else v={eventTime:v,lane:h,tag:s.tag,payload:s.payload,callback:s.callback,next:null},c===null?(d=c=v,l=g):c=c.next=v,o|=h;if(s=s.next,s===null){if(s=r.shared.pending,s===null)break;h=s,s=h.next,h.next=null,r.lastBaseUpdate=h,r.shared.pending=null}}while(!0);if(c===null&&(l=g),r.baseState=l,r.firstBaseUpdate=d,r.lastBaseUpdate=c,t=r.shared.interleaved,t!==null){r=t;do o|=r.lane,r=r.next;while(r!==t)}else a===null&&(r.shared.lanes=0);li|=o,e.lanes=o,e.memoizedState=g}}function sp(e,t,i){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var n=e[t],r=n.callback;if(r!==null){if(n.callback=null,n=i,typeof r!="function")throw Error(w(191,r));r.call(n)}}}var Yn={},Je=Ft(Yn),Bn=Ft(Yn),Vn=Ft(Yn);function ti(e){if(e===Yn)throw Error(w(174));return e}function ns(e,t){switch(B(Vn,t),B(Bn,e),B(Je,Yn),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:Yo(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=Yo(t,e)}Q(Je),B(Je,t)}function Bi(){Q(Je),Q(Bn),Q(Vn)}function Ou(e){ti(Vn.current);var t=ti(Je.current),i=Yo(t,e.type);t!==i&&(B(Bn,e),B(Je,i))}function rs(e){Bn.current===e&&(Q(Je),Q(Bn))}var K=Ft(0);function ca(e){for(var t=e;t!==null;){if(t.tag===13){var i=t.memoizedState;if(i!==null&&(i=i.dehydrated,i===null||i.data==="$?"||i.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var To=[];function as(){for(var e=0;e<To.length;e++)To[e]._workInProgressVersionPrimary=null;To.length=0}var Qr=xt.ReactCurrentDispatcher,Oo=xt.ReactCurrentBatchConfig,oi=0,$=null,ie=null,re=null,fa=!1,_n=!1,Hn=0,Mh=0;function pe(){throw Error(w(321))}function os(e,t){if(t===null)return!1;for(var i=0;i<t.length&&i<e.length;i++)if(!Ge(e[i],t[i]))return!1;return!0}function ls(e,t,i,n,r,a){if(oi=a,$=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Qr.current=e===null||e.memoizedState===null?Bh:Vh,e=i(n,r),_n){a=0;do{if(_n=!1,Hn=0,25<=a)throw Error(w(301));a+=1,re=ie=null,t.updateQueue=null,Qr.current=Hh,e=i(n,r)}while(_n)}if(Qr.current=ga,t=ie!==null&&ie.next!==null,oi=0,re=ie=$=null,fa=!1,t)throw Error(w(300));return e}function ss(){var e=Hn!==0;return Hn=0,e}function Ye(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return re===null?$.memoizedState=re=e:re=re.next=e,re}function Ae(){if(ie===null){var e=$.alternate;e=e!==null?e.memoizedState:null}else e=ie.next;var t=re===null?$.memoizedState:re.next;if(t!==null)re=t,ie=e;else{if(e===null)throw Error(w(310));ie=e,e={memoizedState:ie.memoizedState,baseState:ie.baseState,baseQueue:ie.baseQueue,queue:ie.queue,next:null},re===null?$.memoizedState=re=e:re=re.next=e}return re}function Qn(e,t){return typeof t=="function"?t(e):t}function jo(e){var t=Ae(),i=t.queue;if(i===null)throw Error(w(311));i.lastRenderedReducer=e;var n=ie,r=n.baseQueue,a=i.pending;if(a!==null){if(r!==null){var o=r.next;r.next=a.next,a.next=o}n.baseQueue=r=a,i.pending=null}if(r!==null){a=r.next,n=n.baseState;var s=o=null,l=null,d=a;do{var c=d.lane;if((oi&c)===c)l!==null&&(l=l.next={lane:0,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null}),n=d.hasEagerState?d.eagerState:e(n,d.action);else{var g={lane:c,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null};l===null?(s=l=g,o=n):l=l.next=g,$.lanes|=c,li|=c}d=d.next}while(d!==null&&d!==a);l===null?o=n:l.next=s,Ge(n,t.memoizedState)||(ye=!0),t.memoizedState=n,t.baseState=o,t.baseQueue=l,i.lastRenderedState=n}if(e=i.interleaved,e!==null){r=e;do a=r.lane,$.lanes|=a,li|=a,r=r.next;while(r!==e)}else r===null&&(i.lanes=0);return[t.memoizedState,i.dispatch]}function Ao(e){var t=Ae(),i=t.queue;if(i===null)throw Error(w(311));i.lastRenderedReducer=e;var n=i.dispatch,r=i.pending,a=t.memoizedState;if(r!==null){i.pending=null;var o=r=r.next;do a=e(a,o.action),o=o.next;while(o!==r);Ge(a,t.memoizedState)||(ye=!0),t.memoizedState=a,t.baseQueue===null&&(t.baseState=a),i.lastRenderedState=a}return[a,n]}function ju(){}function Au(e,t){var i=$,n=Ae(),r=t(),a=!Ge(n.memoizedState,r);if(a&&(n.memoizedState=r,ye=!0),n=n.queue,ds(Fu.bind(null,i,n,e),[e]),n.getSnapshot!==t||a||re!==null&&re.memoizedState.tag&1){if(i.flags|=2048,Gn(9,Du.bind(null,i,n,r,t),void 0,null),ae===null)throw Error(w(349));(oi&30)!==0||Mu(i,t,r)}return r}function Mu(e,t,i){e.flags|=16384,e={getSnapshot:t,value:i},t=$.updateQueue,t===null?(t={lastEffect:null,stores:null},$.updateQueue=t,t.stores=[e]):(i=t.stores,i===null?t.stores=[e]:i.push(e))}function Du(e,t,i,n){t.value=i,t.getSnapshot=n,Uu(t)&&Bu(e)}function Fu(e,t,i){return i(function(){Uu(t)&&Bu(e)})}function Uu(e){var t=e.getSnapshot;e=e.value;try{var i=t();return!Ge(e,i)}catch{return!0}}function Bu(e){var t=mt(e,1);t!==null&&Qe(t,e,1,-1)}function dp(e){var t=Ye();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Qn,lastRenderedState:e},t.queue=e,e=e.dispatch=Uh.bind(null,$,e),[t.memoizedState,e]}function Gn(e,t,i,n){return e={tag:e,create:t,destroy:i,deps:n,next:null},t=$.updateQueue,t===null?(t={lastEffect:null,stores:null},$.updateQueue=t,t.lastEffect=e.next=e):(i=t.lastEffect,i===null?t.lastEffect=e.next=e:(n=i.next,i.next=e,e.next=n,t.lastEffect=e)),e}function Vu(){return Ae().memoizedState}function Gr(e,t,i,n){var r=Ye();$.flags|=e,r.memoizedState=Gn(1|t,i,void 0,n===void 0?null:n)}function _a(e,t,i,n){var r=Ae();n=n===void 0?null:n;var a=void 0;if(ie!==null){var o=ie.memoizedState;if(a=o.destroy,n!==null&&os(n,o.deps)){r.memoizedState=Gn(t,i,a,n);return}}$.flags|=e,r.memoizedState=Gn(1|t,i,a,n)}function pp(e,t){return Gr(8390656,8,e,t)}function ds(e,t){return _a(2048,8,e,t)}function Hu(e,t){return _a(4,2,e,t)}function Qu(e,t){return _a(4,4,e,t)}function Gu(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function qu(e,t,i){return i=i!=null?i.concat([e]):null,_a(4,4,Gu.bind(null,t,e),i)}function ps(){}function Wu(e,t){var i=Ae();t=t===void 0?null:t;var n=i.memoizedState;return n!==null&&t!==null&&os(t,n[1])?n[0]:(i.memoizedState=[e,t],e)}function Ku(e,t){var i=Ae();t=t===void 0?null:t;var n=i.memoizedState;return n!==null&&t!==null&&os(t,n[1])?n[0]:(e=e(),i.memoizedState=[e,t],e)}function $u(e,t,i){return(oi&21)===0?(e.baseState&&(e.baseState=!1,ye=!0),e.memoizedState=i):(Ge(i,t)||(i=eu(),$.lanes|=i,li|=i,e.baseState=!0),t)}function Dh(e,t){var i=D;D=i!==0&&4>i?i:4,e(!0);var n=Oo.transition;Oo.transition={};try{e(!1),t()}finally{D=i,Oo.transition=n}}function Yu(){return Ae().memoizedState}function Fh(e,t,i){var n=Ot(e);if(i={lane:n,action:i,hasEagerState:!1,eagerState:null,next:null},Xu(e))Zu(t,i);else if(i=Lu(e,t,i,n),i!==null){var r=he();Qe(i,e,n,r),Ju(i,t,n)}}function Uh(e,t,i){var n=Ot(e),r={lane:n,action:i,hasEagerState:!1,eagerState:null,next:null};if(Xu(e))Zu(t,r);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,i);if(r.hasEagerState=!0,r.eagerState=s,Ge(s,o)){var l=t.interleaved;l===null?(r.next=r,ts(t)):(r.next=l.next,l.next=r),t.interleaved=r;return}}catch{}i=Lu(e,t,r,n),i!==null&&(r=he(),Qe(i,e,n,r),Ju(i,t,n))}}function Xu(e){var t=e.alternate;return e===$||t!==null&&t===$}function Zu(e,t){_n=fa=!0;var i=e.pending;i===null?t.next=t:(t.next=i.next,i.next=t),e.pending=t}function Ju(e,t,i){if((i&4194240)!==0){var n=t.lanes;n&=e.pendingLanes,i|=n,t.lanes=i,Bl(e,i)}}var ga={readContext:je,useCallback:pe,useContext:pe,useEffect:pe,useImperativeHandle:pe,useInsertionEffect:pe,useLayoutEffect:pe,useMemo:pe,useReducer:pe,useRef:pe,useState:pe,useDebugValue:pe,useDeferredValue:pe,useTransition:pe,useMutableSource:pe,useSyncExternalStore:pe,useId:pe,unstable_isNewReconciler:!1},Bh={readContext:je,useCallback:function(e,t){return Ye().memoizedState=[e,t===void 0?null:t],e},useContext:je,useEffect:pp,useImperativeHandle:function(e,t,i){return i=i!=null?i.concat([e]):null,Gr(4194308,4,Gu.bind(null,t,e),i)},useLayoutEffect:function(e,t){return Gr(4194308,4,e,t)},useInsertionEffect:function(e,t){return Gr(4,2,e,t)},useMemo:function(e,t){var i=Ye();return t=t===void 0?null:t,e=e(),i.memoizedState=[e,t],e},useReducer:function(e,t,i){var n=Ye();return t=i!==void 0?i(t):t,n.memoizedState=n.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},n.queue=e,e=e.dispatch=Fh.bind(null,$,e),[n.memoizedState,e]},useRef:function(e){var t=Ye();return e={current:e},t.memoizedState=e},useState:dp,useDebugValue:ps,useDeferredValue:function(e){return Ye().memoizedState=e},useTransition:function(){var e=dp(!1),t=e[0];return e=Dh.bind(null,e[1]),Ye().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,i){var n=$,r=Ye();if(q){if(i===void 0)throw Error(w(407));i=i()}else{if(i=t(),ae===null)throw Error(w(349));(oi&30)!==0||Mu(n,t,i)}r.memoizedState=i;var a={value:i,getSnapshot:t};return r.queue=a,pp(Fu.bind(null,n,a,e),[e]),n.flags|=2048,Gn(9,Du.bind(null,n,a,i,t),void 0,null),i},useId:function(){var e=Ye(),t=ae.identifierPrefix;if(q){var i=ut,n=pt;i=(n&~(1<<32-He(n)-1)).toString(32)+i,t=":"+t+"R"+i,i=Hn++,0<i&&(t+="H"+i.toString(32)),t+=":"}else i=Mh++,t=":"+t+"r"+i.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},Vh={readContext:je,useCallback:Wu,useContext:je,useEffect:ds,useImperativeHandle:qu,useInsertionEffect:Hu,useLayoutEffect:Qu,useMemo:Ku,useReducer:jo,useRef:Vu,useState:function(){return jo(Qn)},useDebugValue:ps,useDeferredValue:function(e){var t=Ae();return $u(t,ie.memoizedState,e)},useTransition:function(){var e=jo(Qn)[0],t=Ae().memoizedState;return[e,t]},useMutableSource:ju,useSyncExternalStore:Au,useId:Yu,unstable_isNewReconciler:!1},Hh={readContext:je,useCallback:Wu,useContext:je,useEffect:ds,useImperativeHandle:qu,useInsertionEffect:Hu,useLayoutEffect:Qu,useMemo:Ku,useReducer:Ao,useRef:Vu,useState:function(){return Ao(Qn)},useDebugValue:ps,useDeferredValue:function(e){var t=Ae();return ie===null?t.memoizedState=e:$u(t,ie.memoizedState,e)},useTransition:function(){var e=Ao(Qn)[0],t=Ae().memoizedState;return[e,t]},useMutableSource:ju,useSyncExternalStore:Au,useId:Yu,unstable_isNewReconciler:!1};function Ue(e,t){if(e&&e.defaultProps){t=Y({},t),e=e.defaultProps;for(var i in e)t[i]===void 0&&(t[i]=e[i]);return t}return t}function xl(e,t,i,n){t=e.memoizedState,i=i(n,t),i=i==null?t:Y({},t,i),e.memoizedState=i,e.lanes===0&&(e.updateQueue.baseState=i)}var Ca={isMounted:function(e){return(e=e._reactInternals)?pi(e)===e:!1},enqueueSetState:function(e,t,i){e=e._reactInternals;var n=he(),r=Ot(e),a=ct(n,r);a.payload=t,i!=null&&(a.callback=i),t=Lt(e,a,r),t!==null&&(Qe(t,e,r,n),Hr(t,e,r))},enqueueReplaceState:function(e,t,i){e=e._reactInternals;var n=he(),r=Ot(e),a=ct(n,r);a.tag=1,a.payload=t,i!=null&&(a.callback=i),t=Lt(e,a,r),t!==null&&(Qe(t,e,r,n),Hr(t,e,r))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var i=he(),n=Ot(e),r=ct(i,n);r.tag=2,t!=null&&(r.callback=t),t=Lt(e,r,n),t!==null&&(Qe(t,e,n,i),Hr(t,e,n))}};function up(e,t,i,n,r,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(n,a,o):t.prototype&&t.prototype.isPureReactComponent?!Mn(i,n)||!Mn(r,a):!0}function ec(e,t,i){var n=!1,r=Mt,a=t.contextType;return typeof a=="object"&&a!==null?a=je(a):(r=we(t)?ri:fe.current,n=t.contextTypes,a=(n=n!=null)?Di(e,r):Mt),t=new t(i,a),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=Ca,e.stateNode=t,t._reactInternals=e,n&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=r,e.__reactInternalMemoizedMaskedChildContext=a),t}function cp(e,t,i,n){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(i,n),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(i,n),t.state!==e&&Ca.enqueueReplaceState(t,t.state,null)}function vl(e,t,i,n){var r=e.stateNode;r.props=i,r.state=e.memoizedState,r.refs={},is(e);var a=t.contextType;typeof a=="object"&&a!==null?r.context=je(a):(a=we(t)?ri:fe.current,r.context=Di(e,a)),r.state=e.memoizedState,a=t.getDerivedStateFromProps,typeof a=="function"&&(xl(e,t,a,i),r.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof r.getSnapshotBeforeUpdate=="function"||typeof r.UNSAFE_componentWillMount!="function"&&typeof r.componentWillMount!="function"||(t=r.state,typeof r.componentWillMount=="function"&&r.componentWillMount(),typeof r.UNSAFE_componentWillMount=="function"&&r.UNSAFE_componentWillMount(),t!==r.state&&Ca.enqueueReplaceState(r,r.state,null),ua(e,i,r,n),r.state=e.memoizedState),typeof r.componentDidMount=="function"&&(e.flags|=4194308)}function Vi(e,t){try{var i="",n=t;do i+=ym(n),n=n.return;while(n);var r=i}catch(a){r=`
Error generating stack: `+a.message+`
`+a.stack}return{value:e,source:t,stack:r,digest:null}}function Mo(e,t,i){return{value:e,source:null,stack:i??null,digest:t??null}}function yl(e,t){try{console.error(t.value)}catch(i){setTimeout(function(){throw i})}}var Qh=typeof WeakMap=="function"?WeakMap:Map;function tc(e,t,i){i=ct(-1,i),i.tag=3,i.payload={element:null};var n=t.value;return i.callback=function(){ha||(ha=!0,zl=n),yl(e,t)},i}function ic(e,t,i){i=ct(-1,i),i.tag=3;var n=e.type.getDerivedStateFromError;if(typeof n=="function"){var r=t.value;i.payload=function(){return n(r)},i.callback=function(){yl(e,t)}}var a=e.stateNode;return a!==null&&typeof a.componentDidCatch=="function"&&(i.callback=function(){yl(e,t),typeof n!="function"&&(Tt===null?Tt=new Set([this]):Tt.add(this));var o=t.stack;this.componentDidCatch(t.value,{componentStack:o!==null?o:""})}),i}function fp(e,t,i){var n=e.pingCache;if(n===null){n=e.pingCache=new Qh;var r=new Set;n.set(t,r)}else r=n.get(t),r===void 0&&(r=new Set,n.set(t,r));r.has(i)||(r.add(i),e=rx.bind(null,e,t,i),t.then(e,e))}function gp(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function mp(e,t,i,n,r){return(e.mode&1)===0?(e===t?e.flags|=65536:(e.flags|=128,i.flags|=131072,i.flags&=-52805,i.tag===1&&(i.alternate===null?i.tag=17:(t=ct(-1,1),t.tag=2,Lt(i,t,1))),i.lanes|=1),e):(e.flags|=65536,e.lanes=r,e)}var Gh=xt.ReactCurrentOwner,ye=!1;function me(e,t,i,n){t.child=e===null?Pu(t,null,i,n):Ui(t,e.child,i,n)}function hp(e,t,i,n,r){i=i.render;var a=t.ref;return ji(t,r),n=ls(e,t,i,n,a,r),i=ss(),e!==null&&!ye?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~r,ht(e,t,r)):(q&&i&&$l(t),t.flags|=1,me(e,t,n,r),t.child)}function xp(e,t,i,n,r){if(e===null){var a=i.type;return typeof a=="function"&&!vs(a)&&a.defaultProps===void 0&&i.compare===null&&i.defaultProps===void 0?(t.tag=15,t.type=a,nc(e,t,a,n,r)):(e=$r(i.type,null,n,t,t.mode,r),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,(e.lanes&r)===0){var o=a.memoizedProps;if(i=i.compare,i=i!==null?i:Mn,i(o,n)&&e.ref===t.ref)return ht(e,t,r)}return t.flags|=1,e=jt(a,n),e.ref=t.ref,e.return=t,t.child=e}function nc(e,t,i,n,r){if(e!==null){var a=e.memoizedProps;if(Mn(a,n)&&e.ref===t.ref)if(ye=!1,t.pendingProps=n=a,(e.lanes&r)!==0)(e.flags&131072)!==0&&(ye=!0);else return t.lanes=e.lanes,ht(e,t,r)}return bl(e,t,i,n,r)}function rc(e,t,i){var n=t.pendingProps,r=n.children,a=e!==null?e.memoizedState:null;if(n.mode==="hidden")if((t.mode&1)===0)t.memoizedState={baseLanes:0,cachePool:null,transitions:null},B(Ri,Se),Se|=i;else{if((i&1073741824)===0)return e=a!==null?a.baseLanes|i:i,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,B(Ri,Se),Se|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},n=a!==null?a.baseLanes:i,B(Ri,Se),Se|=n}else a!==null?(n=a.baseLanes|i,t.memoizedState=null):n=i,B(Ri,Se),Se|=n;return me(e,t,r,i),t.child}function ac(e,t){var i=t.ref;(e===null&&i!==null||e!==null&&e.ref!==i)&&(t.flags|=512,t.flags|=2097152)}function bl(e,t,i,n,r){var a=we(i)?ri:fe.current;return a=Di(t,a),ji(t,r),i=ls(e,t,i,n,a,r),n=ss(),e!==null&&!ye?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~r,ht(e,t,r)):(q&&n&&$l(t),t.flags|=1,me(e,t,i,r),t.child)}function vp(e,t,i,n,r){if(we(i)){var a=!0;oa(t)}else a=!1;if(ji(t,r),t.stateNode===null)qr(e,t),ec(t,i,n),vl(t,i,n,r),n=!0;else if(e===null){var o=t.stateNode,s=t.memoizedProps;o.props=s;var l=o.context,d=i.contextType;typeof d=="object"&&d!==null?d=je(d):(d=we(i)?ri:fe.current,d=Di(t,d));var c=i.getDerivedStateFromProps,g=typeof c=="function"||typeof o.getSnapshotBeforeUpdate=="function";g||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(s!==n||l!==d)&&cp(t,o,n,d),St=!1;var h=t.memoizedState;o.state=h,ua(t,n,o,r),l=t.memoizedState,s!==n||h!==l||be.current||St?(typeof c=="function"&&(xl(t,i,c,n),l=t.memoizedState),(s=St||up(t,i,s,n,h,l,d))?(g||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(t.flags|=4194308)):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=n,t.memoizedState=l),o.props=n,o.state=l,o.context=d,n=s):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),n=!1)}else{o=t.stateNode,Tu(e,t),s=t.memoizedProps,d=t.type===t.elementType?s:Ue(t.type,s),o.props=d,g=t.pendingProps,h=o.context,l=i.contextType,typeof l=="object"&&l!==null?l=je(l):(l=we(i)?ri:fe.current,l=Di(t,l));var v=i.getDerivedStateFromProps;(c=typeof v=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(s!==g||h!==l)&&cp(t,o,n,l),St=!1,h=t.memoizedState,o.state=h,ua(t,n,o,r);var b=t.memoizedState;s!==g||h!==b||be.current||St?(typeof v=="function"&&(xl(t,i,v,n),b=t.memoizedState),(d=St||up(t,i,d,n,h,b,l)||!1)?(c||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(n,b,l),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(n,b,l)),typeof o.componentDidUpdate=="function"&&(t.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof o.componentDidUpdate!="function"||s===e.memoizedProps&&h===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||s===e.memoizedProps&&h===e.memoizedState||(t.flags|=1024),t.memoizedProps=n,t.memoizedState=b),o.props=n,o.state=b,o.context=l,n=d):(typeof o.componentDidUpdate!="function"||s===e.memoizedProps&&h===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||s===e.memoizedProps&&h===e.memoizedState||(t.flags|=1024),n=!1)}return wl(e,t,i,n,a,r)}function wl(e,t,i,n,r,a){ac(e,t);var o=(t.flags&128)!==0;if(!n&&!o)return r&&np(t,i,!1),ht(e,t,a);n=t.stateNode,Gh.current=t;var s=o&&typeof i.getDerivedStateFromError!="function"?null:n.render();return t.flags|=1,e!==null&&o?(t.child=Ui(t,e.child,null,a),t.child=Ui(t,null,s,a)):me(e,t,s,a),t.memoizedState=n.state,r&&np(t,i,!0),t.child}function oc(e){var t=e.stateNode;t.pendingContext?ip(e,t.pendingContext,t.pendingContext!==t.context):t.context&&ip(e,t.context,!1),ns(e,t.containerInfo)}function yp(e,t,i,n,r){return Fi(),Xl(r),t.flags|=256,me(e,t,i,n),t.child}var kl={dehydrated:null,treeContext:null,retryLane:0};function Sl(e){return{baseLanes:e,cachePool:null,transitions:null}}function lc(e,t,i){var n=t.pendingProps,r=K.current,a=!1,o=(t.flags&128)!==0,s;if((s=o)||(s=e!==null&&e.memoizedState===null?!1:(r&2)!==0),s?(a=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(r|=1),B(K,r&1),e===null)return ml(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((t.mode&1)===0?t.lanes=1:e.data==="$!"?t.lanes=8:t.lanes=1073741824,null):(o=n.children,e=n.fallback,a?(n=t.mode,a=t.child,o={mode:"hidden",children:o},(n&1)===0&&a!==null?(a.childLanes=0,a.pendingProps=o):a=Ra(o,n,0,null),e=ni(e,n,i,null),a.return=t,e.return=t,a.sibling=e,t.child=a,t.child.memoizedState=Sl(i),t.memoizedState=kl,e):us(t,o));if(r=e.memoizedState,r!==null&&(s=r.dehydrated,s!==null))return qh(e,t,o,n,s,r,i);if(a){a=n.fallback,o=t.mode,r=e.child,s=r.sibling;var l={mode:"hidden",children:n.children};return(o&1)===0&&t.child!==r?(n=t.child,n.childLanes=0,n.pendingProps=l,t.deletions=null):(n=jt(r,l),n.subtreeFlags=r.subtreeFlags&14680064),s!==null?a=jt(s,a):(a=ni(a,o,i,null),a.flags|=2),a.return=t,n.return=t,n.sibling=a,t.child=n,n=a,a=t.child,o=e.child.memoizedState,o=o===null?Sl(i):{baseLanes:o.baseLanes|i,cachePool:null,transitions:o.transitions},a.memoizedState=o,a.childLanes=e.childLanes&~i,t.memoizedState=kl,n}return a=e.child,e=a.sibling,n=jt(a,{mode:"visible",children:n.children}),(t.mode&1)===0&&(n.lanes=i),n.return=t,n.sibling=null,e!==null&&(i=t.deletions,i===null?(t.deletions=[e],t.flags|=16):i.push(e)),t.child=n,t.memoizedState=null,n}function us(e,t){return t=Ra({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function Mr(e,t,i,n){return n!==null&&Xl(n),Ui(t,e.child,null,i),e=us(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function qh(e,t,i,n,r,a,o){if(i)return t.flags&256?(t.flags&=-257,n=Mo(Error(w(422))),Mr(e,t,o,n)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(a=n.fallback,r=t.mode,n=Ra({mode:"visible",children:n.children},r,0,null),a=ni(a,r,o,null),a.flags|=2,n.return=t,a.return=t,n.sibling=a,t.child=n,(t.mode&1)!==0&&Ui(t,e.child,null,o),t.child.memoizedState=Sl(o),t.memoizedState=kl,a);if((t.mode&1)===0)return Mr(e,t,o,null);if(r.data==="$!"){if(n=r.nextSibling&&r.nextSibling.dataset,n)var s=n.dgst;return n=s,a=Error(w(419)),n=Mo(a,n,void 0),Mr(e,t,o,n)}if(s=(o&e.childLanes)!==0,ye||s){if(n=ae,n!==null){switch(o&-o){case 4:r=2;break;case 16:r=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:r=32;break;case 536870912:r=268435456;break;default:r=0}r=(r&(n.suspendedLanes|o))!==0?0:r,r!==0&&r!==a.retryLane&&(a.retryLane=r,mt(e,r),Qe(n,e,r,-1))}return xs(),n=Mo(Error(w(421))),Mr(e,t,o,n)}return r.data==="$?"?(t.flags|=128,t.child=e.child,t=ax.bind(null,e),r._reactRetry=t,null):(e=a.treeContext,Ie=Pt(r.nextSibling),Ee=t,q=!0,Ve=null,e!==null&&(Pe[Le++]=pt,Pe[Le++]=ut,Pe[Le++]=ai,pt=e.id,ut=e.overflow,ai=t),t=us(t,n.children),t.flags|=4096,t)}function bp(e,t,i){e.lanes|=t;var n=e.alternate;n!==null&&(n.lanes|=t),hl(e.return,t,i)}function Do(e,t,i,n,r){var a=e.memoizedState;a===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:n,tail:i,tailMode:r}:(a.isBackwards=t,a.rendering=null,a.renderingStartTime=0,a.last=n,a.tail=i,a.tailMode=r)}function sc(e,t,i){var n=t.pendingProps,r=n.revealOrder,a=n.tail;if(me(e,t,n.children,i),n=K.current,(n&2)!==0)n=n&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&bp(e,i,t);else if(e.tag===19)bp(e,i,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}n&=1}if(B(K,n),(t.mode&1)===0)t.memoizedState=null;else switch(r){case"forwards":for(i=t.child,r=null;i!==null;)e=i.alternate,e!==null&&ca(e)===null&&(r=i),i=i.sibling;i=r,i===null?(r=t.child,t.child=null):(r=i.sibling,i.sibling=null),Do(t,!1,r,i,a);break;case"backwards":for(i=null,r=t.child,t.child=null;r!==null;){if(e=r.alternate,e!==null&&ca(e)===null){t.child=r;break}e=r.sibling,r.sibling=i,i=r,r=e}Do(t,!0,i,null,a);break;case"together":Do(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function qr(e,t){(t.mode&1)===0&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function ht(e,t,i){if(e!==null&&(t.dependencies=e.dependencies),li|=t.lanes,(i&t.childLanes)===0)return null;if(e!==null&&t.child!==e.child)throw Error(w(153));if(t.child!==null){for(e=t.child,i=jt(e,e.pendingProps),t.child=i,i.return=t;e.sibling!==null;)e=e.sibling,i=i.sibling=jt(e,e.pendingProps),i.return=t;i.sibling=null}return t.child}function Wh(e,t,i){switch(t.tag){case 3:oc(t),Fi();break;case 5:Ou(t);break;case 1:we(t.type)&&oa(t);break;case 4:ns(t,t.stateNode.containerInfo);break;case 10:var n=t.type._context,r=t.memoizedProps.value;B(da,n._currentValue),n._currentValue=r;break;case 13:if(n=t.memoizedState,n!==null)return n.dehydrated!==null?(B(K,K.current&1),t.flags|=128,null):(i&t.child.childLanes)!==0?lc(e,t,i):(B(K,K.current&1),e=ht(e,t,i),e!==null?e.sibling:null);B(K,K.current&1);break;case 19:if(n=(i&t.childLanes)!==0,(e.flags&128)!==0){if(n)return sc(e,t,i);t.flags|=128}if(r=t.memoizedState,r!==null&&(r.rendering=null,r.tail=null,r.lastEffect=null),B(K,K.current),n)break;return null;case 22:case 23:return t.lanes=0,rc(e,t,i)}return ht(e,t,i)}var dc,Il,pc,uc;dc=function(e,t){for(var i=t.child;i!==null;){if(i.tag===5||i.tag===6)e.appendChild(i.stateNode);else if(i.tag!==4&&i.child!==null){i.child.return=i,i=i.child;continue}if(i===t)break;for(;i.sibling===null;){if(i.return===null||i.return===t)return;i=i.return}i.sibling.return=i.return,i=i.sibling}};Il=function(){};pc=function(e,t,i,n){var r=e.memoizedProps;if(r!==n){e=t.stateNode,ti(Je.current);var a=null;switch(i){case"input":r=qo(e,r),n=qo(e,n),a=[];break;case"select":r=Y({},r,{value:void 0}),n=Y({},n,{value:void 0}),a=[];break;case"textarea":r=$o(e,r),n=$o(e,n),a=[];break;default:typeof r.onClick!="function"&&typeof n.onClick=="function"&&(e.onclick=ra)}Xo(i,n);var o;i=null;for(d in r)if(!n.hasOwnProperty(d)&&r.hasOwnProperty(d)&&r[d]!=null)if(d==="style"){var s=r[d];for(o in s)s.hasOwnProperty(o)&&(i||(i={}),i[o]="")}else d!=="dangerouslySetInnerHTML"&&d!=="children"&&d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&d!=="autoFocus"&&(Rn.hasOwnProperty(d)?a||(a=[]):(a=a||[]).push(d,null));for(d in n){var l=n[d];if(s=r?.[d],n.hasOwnProperty(d)&&l!==s&&(l!=null||s!=null))if(d==="style")if(s){for(o in s)!s.hasOwnProperty(o)||l&&l.hasOwnProperty(o)||(i||(i={}),i[o]="");for(o in l)l.hasOwnProperty(o)&&s[o]!==l[o]&&(i||(i={}),i[o]=l[o])}else i||(a||(a=[]),a.push(d,i)),i=l;else d==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,s=s?s.__html:void 0,l!=null&&s!==l&&(a=a||[]).push(d,l)):d==="children"?typeof l!="string"&&typeof l!="number"||(a=a||[]).push(d,""+l):d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&(Rn.hasOwnProperty(d)?(l!=null&&d==="onScroll"&&H("scroll",e),a||s===l||(a=[])):(a=a||[]).push(d,l))}i&&(a=a||[]).push("style",i);var d=a;(t.updateQueue=d)&&(t.flags|=4)}};uc=function(e,t,i,n){i!==n&&(t.flags|=4)};function gn(e,t){if(!q)switch(e.tailMode){case"hidden":t=e.tail;for(var i=null;t!==null;)t.alternate!==null&&(i=t),t=t.sibling;i===null?e.tail=null:i.sibling=null;break;case"collapsed":i=e.tail;for(var n=null;i!==null;)i.alternate!==null&&(n=i),i=i.sibling;n===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:n.sibling=null}}function ue(e){var t=e.alternate!==null&&e.alternate.child===e.child,i=0,n=0;if(t)for(var r=e.child;r!==null;)i|=r.lanes|r.childLanes,n|=r.subtreeFlags&14680064,n|=r.flags&14680064,r.return=e,r=r.sibling;else for(r=e.child;r!==null;)i|=r.lanes|r.childLanes,n|=r.subtreeFlags,n|=r.flags,r.return=e,r=r.sibling;return e.subtreeFlags|=n,e.childLanes=i,t}function Kh(e,t,i){var n=t.pendingProps;switch(Yl(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ue(t),null;case 1:return we(t.type)&&aa(),ue(t),null;case 3:return n=t.stateNode,Bi(),Q(be),Q(fe),as(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(jr(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Ve!==null&&(Ll(Ve),Ve=null))),Il(e,t),ue(t),null;case 5:rs(t);var r=ti(Vn.current);if(i=t.type,e!==null&&t.stateNode!=null)pc(e,t,i,n,r),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!n){if(t.stateNode===null)throw Error(w(166));return ue(t),null}if(e=ti(Je.current),jr(t)){n=t.stateNode,i=t.type;var a=t.memoizedProps;switch(n[Xe]=t,n[Un]=a,e=(t.mode&1)!==0,i){case"dialog":H("cancel",n),H("close",n);break;case"iframe":case"object":case"embed":H("load",n);break;case"video":case"audio":for(r=0;r<bn.length;r++)H(bn[r],n);break;case"source":H("error",n);break;case"img":case"image":case"link":H("error",n),H("load",n);break;case"details":H("toggle",n);break;case"input":Nd(n,a),H("invalid",n);break;case"select":n._wrapperState={wasMultiple:!!a.multiple},H("invalid",n);break;case"textarea":Rd(n,a),H("invalid",n)}Xo(i,a),r=null;for(var o in a)if(a.hasOwnProperty(o)){var s=a[o];o==="children"?typeof s=="string"?n.textContent!==s&&(a.suppressHydrationWarning!==!0&&Or(n.textContent,s,e),r=["children",s]):typeof s=="number"&&n.textContent!==""+s&&(a.suppressHydrationWarning!==!0&&Or(n.textContent,s,e),r=["children",""+s]):Rn.hasOwnProperty(o)&&s!=null&&o==="onScroll"&&H("scroll",n)}switch(i){case"input":kr(n),zd(n,a,!0);break;case"textarea":kr(n),Pd(n);break;case"select":case"option":break;default:typeof a.onClick=="function"&&(n.onclick=ra)}n=r,t.updateQueue=n,n!==null&&(t.flags|=4)}else{o=r.nodeType===9?r:r.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=Fp(i)),e==="http://www.w3.org/1999/xhtml"?i==="script"?(e=o.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof n.is=="string"?e=o.createElement(i,{is:n.is}):(e=o.createElement(i),i==="select"&&(o=e,n.multiple?o.multiple=!0:n.size&&(o.size=n.size))):e=o.createElementNS(e,i),e[Xe]=t,e[Un]=n,dc(e,t,!1,!1),t.stateNode=e;e:{switch(o=Zo(i,n),i){case"dialog":H("cancel",e),H("close",e),r=n;break;case"iframe":case"object":case"embed":H("load",e),r=n;break;case"video":case"audio":for(r=0;r<bn.length;r++)H(bn[r],e);r=n;break;case"source":H("error",e),r=n;break;case"img":case"image":case"link":H("error",e),H("load",e),r=n;break;case"details":H("toggle",e),r=n;break;case"input":Nd(e,n),r=qo(e,n),H("invalid",e);break;case"option":r=n;break;case"select":e._wrapperState={wasMultiple:!!n.multiple},r=Y({},n,{value:void 0}),H("invalid",e);break;case"textarea":Rd(e,n),r=$o(e,n),H("invalid",e);break;default:r=n}Xo(i,r),s=r;for(a in s)if(s.hasOwnProperty(a)){var l=s[a];a==="style"?Vp(e,l):a==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,l!=null&&Up(e,l)):a==="children"?typeof l=="string"?(i!=="textarea"||l!=="")&&Pn(e,l):typeof l=="number"&&Pn(e,""+l):a!=="suppressContentEditableWarning"&&a!=="suppressHydrationWarning"&&a!=="autoFocus"&&(Rn.hasOwnProperty(a)?l!=null&&a==="onScroll"&&H("scroll",e):l!=null&&jl(e,a,l,o))}switch(i){case"input":kr(e),zd(e,n,!1);break;case"textarea":kr(e),Pd(e);break;case"option":n.value!=null&&e.setAttribute("value",""+At(n.value));break;case"select":e.multiple=!!n.multiple,a=n.value,a!=null?Pi(e,!!n.multiple,a,!1):n.defaultValue!=null&&Pi(e,!!n.multiple,n.defaultValue,!0);break;default:typeof r.onClick=="function"&&(e.onclick=ra)}switch(i){case"button":case"input":case"select":case"textarea":n=!!n.autoFocus;break e;case"img":n=!0;break e;default:n=!1}}n&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return ue(t),null;case 6:if(e&&t.stateNode!=null)uc(e,t,e.memoizedProps,n);else{if(typeof n!="string"&&t.stateNode===null)throw Error(w(166));if(i=ti(Vn.current),ti(Je.current),jr(t)){if(n=t.stateNode,i=t.memoizedProps,n[Xe]=t,(a=n.nodeValue!==i)&&(e=Ee,e!==null))switch(e.tag){case 3:Or(n.nodeValue,i,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Or(n.nodeValue,i,(e.mode&1)!==0)}a&&(t.flags|=4)}else n=(i.nodeType===9?i:i.ownerDocument).createTextNode(n),n[Xe]=t,t.stateNode=n}return ue(t),null;case 13:if(Q(K),n=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(q&&Ie!==null&&(t.mode&1)!==0&&(t.flags&128)===0)zu(),Fi(),t.flags|=98560,a=!1;else if(a=jr(t),n!==null&&n.dehydrated!==null){if(e===null){if(!a)throw Error(w(318));if(a=t.memoizedState,a=a!==null?a.dehydrated:null,!a)throw Error(w(317));a[Xe]=t}else Fi(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;ue(t),a=!1}else Ve!==null&&(Ll(Ve),Ve=null),a=!0;if(!a)return t.flags&65536?t:null}return(t.flags&128)!==0?(t.lanes=i,t):(n=n!==null,n!==(e!==null&&e.memoizedState!==null)&&n&&(t.child.flags|=8192,(t.mode&1)!==0&&(e===null||(K.current&1)!==0?ne===0&&(ne=3):xs())),t.updateQueue!==null&&(t.flags|=4),ue(t),null);case 4:return Bi(),Il(e,t),e===null&&Dn(t.stateNode.containerInfo),ue(t),null;case 10:return es(t.type._context),ue(t),null;case 17:return we(t.type)&&aa(),ue(t),null;case 19:if(Q(K),a=t.memoizedState,a===null)return ue(t),null;if(n=(t.flags&128)!==0,o=a.rendering,o===null)if(n)gn(a,!1);else{if(ne!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(o=ca(e),o!==null){for(t.flags|=128,gn(a,!1),n=o.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),t.subtreeFlags=0,n=i,i=t.child;i!==null;)a=i,e=n,a.flags&=14680066,o=a.alternate,o===null?(a.childLanes=0,a.lanes=e,a.child=null,a.subtreeFlags=0,a.memoizedProps=null,a.memoizedState=null,a.updateQueue=null,a.dependencies=null,a.stateNode=null):(a.childLanes=o.childLanes,a.lanes=o.lanes,a.child=o.child,a.subtreeFlags=0,a.deletions=null,a.memoizedProps=o.memoizedProps,a.memoizedState=o.memoizedState,a.updateQueue=o.updateQueue,a.type=o.type,e=o.dependencies,a.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),i=i.sibling;return B(K,K.current&1|2),t.child}e=e.sibling}a.tail!==null&&J()>Hi&&(t.flags|=128,n=!0,gn(a,!1),t.lanes=4194304)}else{if(!n)if(e=ca(o),e!==null){if(t.flags|=128,n=!0,i=e.updateQueue,i!==null&&(t.updateQueue=i,t.flags|=4),gn(a,!0),a.tail===null&&a.tailMode==="hidden"&&!o.alternate&&!q)return ue(t),null}else 2*J()-a.renderingStartTime>Hi&&i!==1073741824&&(t.flags|=128,n=!0,gn(a,!1),t.lanes=4194304);a.isBackwards?(o.sibling=t.child,t.child=o):(i=a.last,i!==null?i.sibling=o:t.child=o,a.last=o)}return a.tail!==null?(t=a.tail,a.rendering=t,a.tail=t.sibling,a.renderingStartTime=J(),t.sibling=null,i=K.current,B(K,n?i&1|2:i&1),t):(ue(t),null);case 22:case 23:return hs(),n=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==n&&(t.flags|=8192),n&&(t.mode&1)!==0?(Se&1073741824)!==0&&(ue(t),t.subtreeFlags&6&&(t.flags|=8192)):ue(t),null;case 24:return null;case 25:return null}throw Error(w(156,t.tag))}function $h(e,t){switch(Yl(t),t.tag){case 1:return we(t.type)&&aa(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Bi(),Q(be),Q(fe),as(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 5:return rs(t),null;case 13:if(Q(K),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(w(340));Fi()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return Q(K),null;case 4:return Bi(),null;case 10:return es(t.type._context),null;case 22:case 23:return hs(),null;case 24:return null;default:return null}}var Dr=!1,ce=!1,Yh=typeof WeakSet=="function"?WeakSet:Set,_=null;function zi(e,t){var i=e.ref;if(i!==null)if(typeof i=="function")try{i(null)}catch(n){X(e,t,n)}else i.current=null}function El(e,t,i){try{i()}catch(n){X(e,t,n)}}var wp=!1;function Xh(e,t){if(sl=ta,e=hu(),Kl(e)){if("selectionStart"in e)var i={start:e.selectionStart,end:e.selectionEnd};else e:{i=(i=e.ownerDocument)&&i.defaultView||window;var n=i.getSelection&&i.getSelection();if(n&&n.rangeCount!==0){i=n.anchorNode;var r=n.anchorOffset,a=n.focusNode;n=n.focusOffset;try{i.nodeType,a.nodeType}catch{i=null;break e}var o=0,s=-1,l=-1,d=0,c=0,g=e,h=null;t:for(;;){for(var v;g!==i||r!==0&&g.nodeType!==3||(s=o+r),g!==a||n!==0&&g.nodeType!==3||(l=o+n),g.nodeType===3&&(o+=g.nodeValue.length),(v=g.firstChild)!==null;)h=g,g=v;for(;;){if(g===e)break t;if(h===i&&++d===r&&(s=o),h===a&&++c===n&&(l=o),(v=g.nextSibling)!==null)break;g=h,h=g.parentNode}g=v}i=s===-1||l===-1?null:{start:s,end:l}}else i=null}i=i||{start:0,end:0}}else i=null;for(dl={focusedElem:e,selectionRange:i},ta=!1,_=t;_!==null;)if(t=_,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,_=e;else for(;_!==null;){t=_;try{var b=t.alternate;if((t.flags&1024)!==0)switch(t.tag){case 0:case 11:case 15:break;case 1:if(b!==null){var m=b.memoizedProps,S=b.memoizedState,u=t.stateNode,p=u.getSnapshotBeforeUpdate(t.elementType===t.type?m:Ue(t.type,m),S);u.__reactInternalSnapshotBeforeUpdate=p}break;case 3:var f=t.stateNode.containerInfo;f.nodeType===1?f.textContent="":f.nodeType===9&&f.documentElement&&f.removeChild(f.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(w(163))}}catch(y){X(t,t.return,y)}if(e=t.sibling,e!==null){e.return=t.return,_=e;break}_=t.return}return b=wp,wp=!1,b}function Cn(e,t,i){var n=t.updateQueue;if(n=n!==null?n.lastEffect:null,n!==null){var r=n=n.next;do{if((r.tag&e)===e){var a=r.destroy;r.destroy=void 0,a!==void 0&&El(t,i,a)}r=r.next}while(r!==n)}}function Na(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var i=t=t.next;do{if((i.tag&e)===e){var n=i.create;i.destroy=n()}i=i.next}while(i!==t)}}function _l(e){var t=e.ref;if(t!==null){var i=e.stateNode;e.tag,e=i,typeof t=="function"?t(e):t.current=e}}function cc(e){var t=e.alternate;t!==null&&(e.alternate=null,cc(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[Xe],delete t[Un],delete t[cl],delete t[Th],delete t[Oh])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function fc(e){return e.tag===5||e.tag===3||e.tag===4}function kp(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||fc(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Cl(e,t,i){var n=e.tag;if(n===5||n===6)e=e.stateNode,t?i.nodeType===8?i.parentNode.insertBefore(e,t):i.insertBefore(e,t):(i.nodeType===8?(t=i.parentNode,t.insertBefore(e,i)):(t=i,t.appendChild(e)),i=i._reactRootContainer,i!=null||t.onclick!==null||(t.onclick=ra));else if(n!==4&&(e=e.child,e!==null))for(Cl(e,t,i),e=e.sibling;e!==null;)Cl(e,t,i),e=e.sibling}function Nl(e,t,i){var n=e.tag;if(n===5||n===6)e=e.stateNode,t?i.insertBefore(e,t):i.appendChild(e);else if(n!==4&&(e=e.child,e!==null))for(Nl(e,t,i),e=e.sibling;e!==null;)Nl(e,t,i),e=e.sibling}var oe=null,Be=!1;function wt(e,t,i){for(i=i.child;i!==null;)gc(e,t,i),i=i.sibling}function gc(e,t,i){if(Ze&&typeof Ze.onCommitFiberUnmount=="function")try{Ze.onCommitFiberUnmount(ba,i)}catch{}switch(i.tag){case 5:ce||zi(i,t);case 6:var n=oe,r=Be;oe=null,wt(e,t,i),oe=n,Be=r,oe!==null&&(Be?(e=oe,i=i.stateNode,e.nodeType===8?e.parentNode.removeChild(i):e.removeChild(i)):oe.removeChild(i.stateNode));break;case 18:oe!==null&&(Be?(e=oe,i=i.stateNode,e.nodeType===8?Po(e.parentNode,i):e.nodeType===1&&Po(e,i),jn(e)):Po(oe,i.stateNode));break;case 4:n=oe,r=Be,oe=i.stateNode.containerInfo,Be=!0,wt(e,t,i),oe=n,Be=r;break;case 0:case 11:case 14:case 15:if(!ce&&(n=i.updateQueue,n!==null&&(n=n.lastEffect,n!==null))){r=n=n.next;do{var a=r,o=a.destroy;a=a.tag,o!==void 0&&((a&2)!==0||(a&4)!==0)&&El(i,t,o),r=r.next}while(r!==n)}wt(e,t,i);break;case 1:if(!ce&&(zi(i,t),n=i.stateNode,typeof n.componentWillUnmount=="function"))try{n.props=i.memoizedProps,n.state=i.memoizedState,n.componentWillUnmount()}catch(s){X(i,t,s)}wt(e,t,i);break;case 21:wt(e,t,i);break;case 22:i.mode&1?(ce=(n=ce)||i.memoizedState!==null,wt(e,t,i),ce=n):wt(e,t,i);break;default:wt(e,t,i)}}function Sp(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var i=e.stateNode;i===null&&(i=e.stateNode=new Yh),t.forEach(function(n){var r=ox.bind(null,e,n);i.has(n)||(i.add(n),n.then(r,r))})}}function Fe(e,t){var i=t.deletions;if(i!==null)for(var n=0;n<i.length;n++){var r=i[n];try{var a=e,o=t,s=o;e:for(;s!==null;){switch(s.tag){case 5:oe=s.stateNode,Be=!1;break e;case 3:oe=s.stateNode.containerInfo,Be=!0;break e;case 4:oe=s.stateNode.containerInfo,Be=!0;break e}s=s.return}if(oe===null)throw Error(w(160));gc(a,o,r),oe=null,Be=!1;var l=r.alternate;l!==null&&(l.return=null),r.return=null}catch(d){X(r,t,d)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)mc(t,e),t=t.sibling}function mc(e,t){var i=e.alternate,n=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(Fe(t,e),$e(e),n&4){try{Cn(3,e,e.return),Na(3,e)}catch(m){X(e,e.return,m)}try{Cn(5,e,e.return)}catch(m){X(e,e.return,m)}}break;case 1:Fe(t,e),$e(e),n&512&&i!==null&&zi(i,i.return);break;case 5:if(Fe(t,e),$e(e),n&512&&i!==null&&zi(i,i.return),e.flags&32){var r=e.stateNode;try{Pn(r,"")}catch(m){X(e,e.return,m)}}if(n&4&&(r=e.stateNode,r!=null)){var a=e.memoizedProps,o=i!==null?i.memoizedProps:a,s=e.type,l=e.updateQueue;if(e.updateQueue=null,l!==null)try{s==="input"&&a.type==="radio"&&a.name!=null&&Mp(r,a),Zo(s,o);var d=Zo(s,a);for(o=0;o<l.length;o+=2){var c=l[o],g=l[o+1];c==="style"?Vp(r,g):c==="dangerouslySetInnerHTML"?Up(r,g):c==="children"?Pn(r,g):jl(r,c,g,d)}switch(s){case"input":Wo(r,a);break;case"textarea":Dp(r,a);break;case"select":var h=r._wrapperState.wasMultiple;r._wrapperState.wasMultiple=!!a.multiple;var v=a.value;v!=null?Pi(r,!!a.multiple,v,!1):h!==!!a.multiple&&(a.defaultValue!=null?Pi(r,!!a.multiple,a.defaultValue,!0):Pi(r,!!a.multiple,a.multiple?[]:"",!1))}r[Un]=a}catch(m){X(e,e.return,m)}}break;case 6:if(Fe(t,e),$e(e),n&4){if(e.stateNode===null)throw Error(w(162));r=e.stateNode,a=e.memoizedProps;try{r.nodeValue=a}catch(m){X(e,e.return,m)}}break;case 3:if(Fe(t,e),$e(e),n&4&&i!==null&&i.memoizedState.isDehydrated)try{jn(t.containerInfo)}catch(m){X(e,e.return,m)}break;case 4:Fe(t,e),$e(e);break;case 13:Fe(t,e),$e(e),r=e.child,r.flags&8192&&(a=r.memoizedState!==null,r.stateNode.isHidden=a,!a||r.alternate!==null&&r.alternate.memoizedState!==null||(gs=J())),n&4&&Sp(e);break;case 22:if(c=i!==null&&i.memoizedState!==null,e.mode&1?(ce=(d=ce)||c,Fe(t,e),ce=d):Fe(t,e),$e(e),n&8192){if(d=e.memoizedState!==null,(e.stateNode.isHidden=d)&&!c&&(e.mode&1)!==0)for(_=e,c=e.child;c!==null;){for(g=_=c;_!==null;){switch(h=_,v=h.child,h.tag){case 0:case 11:case 14:case 15:Cn(4,h,h.return);break;case 1:zi(h,h.return);var b=h.stateNode;if(typeof b.componentWillUnmount=="function"){n=h,i=h.return;try{t=n,b.props=t.memoizedProps,b.state=t.memoizedState,b.componentWillUnmount()}catch(m){X(n,i,m)}}break;case 5:zi(h,h.return);break;case 22:if(h.memoizedState!==null){Ep(g);continue}}v!==null?(v.return=h,_=v):Ep(g)}c=c.sibling}e:for(c=null,g=e;;){if(g.tag===5){if(c===null){c=g;try{r=g.stateNode,d?(a=r.style,typeof a.setProperty=="function"?a.setProperty("display","none","important"):a.display="none"):(s=g.stateNode,l=g.memoizedProps.style,o=l!=null&&l.hasOwnProperty("display")?l.display:null,s.style.display=Bp("display",o))}catch(m){X(e,e.return,m)}}}else if(g.tag===6){if(c===null)try{g.stateNode.nodeValue=d?"":g.memoizedProps}catch(m){X(e,e.return,m)}}else if((g.tag!==22&&g.tag!==23||g.memoizedState===null||g===e)&&g.child!==null){g.child.return=g,g=g.child;continue}if(g===e)break e;for(;g.sibling===null;){if(g.return===null||g.return===e)break e;c===g&&(c=null),g=g.return}c===g&&(c=null),g.sibling.return=g.return,g=g.sibling}}break;case 19:Fe(t,e),$e(e),n&4&&Sp(e);break;case 21:break;default:Fe(t,e),$e(e)}}function $e(e){var t=e.flags;if(t&2){try{e:{for(var i=e.return;i!==null;){if(fc(i)){var n=i;break e}i=i.return}throw Error(w(160))}switch(n.tag){case 5:var r=n.stateNode;n.flags&32&&(Pn(r,""),n.flags&=-33);var a=kp(e);Nl(e,a,r);break;case 3:case 4:var o=n.stateNode.containerInfo,s=kp(e);Cl(e,s,o);break;default:throw Error(w(161))}}catch(l){X(e,e.return,l)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Zh(e,t,i){_=e,hc(e,t,i)}function hc(e,t,i){for(var n=(e.mode&1)!==0;_!==null;){var r=_,a=r.child;if(r.tag===22&&n){var o=r.memoizedState!==null||Dr;if(!o){var s=r.alternate,l=s!==null&&s.memoizedState!==null||ce;s=Dr;var d=ce;if(Dr=o,(ce=l)&&!d)for(_=r;_!==null;)o=_,l=o.child,o.tag===22&&o.memoizedState!==null?_p(r):l!==null?(l.return=o,_=l):_p(r);for(;a!==null;)_=a,hc(a,t,i),a=a.sibling;_=r,Dr=s,ce=d}Ip(e,t,i)}else(r.subtreeFlags&8772)!==0&&a!==null?(a.return=r,_=a):Ip(e,t,i)}}function Ip(e){for(;_!==null;){var t=_;if((t.flags&8772)!==0){var i=t.alternate;try{if((t.flags&8772)!==0)switch(t.tag){case 0:case 11:case 15:ce||Na(5,t);break;case 1:var n=t.stateNode;if(t.flags&4&&!ce)if(i===null)n.componentDidMount();else{var r=t.elementType===t.type?i.memoizedProps:Ue(t.type,i.memoizedProps);n.componentDidUpdate(r,i.memoizedState,n.__reactInternalSnapshotBeforeUpdate)}var a=t.updateQueue;a!==null&&sp(t,a,n);break;case 3:var o=t.updateQueue;if(o!==null){if(i=null,t.child!==null)switch(t.child.tag){case 5:i=t.child.stateNode;break;case 1:i=t.child.stateNode}sp(t,o,i)}break;case 5:var s=t.stateNode;if(i===null&&t.flags&4){i=s;var l=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":l.autoFocus&&i.focus();break;case"img":l.src&&(i.src=l.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var d=t.alternate;if(d!==null){var c=d.memoizedState;if(c!==null){var g=c.dehydrated;g!==null&&jn(g)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(w(163))}ce||t.flags&512&&_l(t)}catch(h){X(t,t.return,h)}}if(t===e){_=null;break}if(i=t.sibling,i!==null){i.return=t.return,_=i;break}_=t.return}}function Ep(e){for(;_!==null;){var t=_;if(t===e){_=null;break}var i=t.sibling;if(i!==null){i.return=t.return,_=i;break}_=t.return}}function _p(e){for(;_!==null;){var t=_;try{switch(t.tag){case 0:case 11:case 15:var i=t.return;try{Na(4,t)}catch(l){X(t,i,l)}break;case 1:var n=t.stateNode;if(typeof n.componentDidMount=="function"){var r=t.return;try{n.componentDidMount()}catch(l){X(t,r,l)}}var a=t.return;try{_l(t)}catch(l){X(t,a,l)}break;case 5:var o=t.return;try{_l(t)}catch(l){X(t,o,l)}}}catch(l){X(t,t.return,l)}if(t===e){_=null;break}var s=t.sibling;if(s!==null){s.return=t.return,_=s;break}_=t.return}}var Jh=Math.ceil,ma=xt.ReactCurrentDispatcher,cs=xt.ReactCurrentOwner,Oe=xt.ReactCurrentBatchConfig,A=0,ae=null,te=null,le=0,Se=0,Ri=Ft(0),ne=0,qn=null,li=0,za=0,fs=0,Nn=null,ve=null,gs=0,Hi=1/0,st=null,ha=!1,zl=null,Tt=null,Fr=!1,Ct=null,xa=0,zn=0,Rl=null,Wr=-1,Kr=0;function he(){return(A&6)!==0?J():Wr!==-1?Wr:Wr=J()}function Ot(e){return(e.mode&1)===0?1:(A&2)!==0&&le!==0?le&-le:Ah.transition!==null?(Kr===0&&(Kr=eu()),Kr):(e=D,e!==0||(e=window.event,e=e===void 0?16:lu(e.type)),e)}function Qe(e,t,i,n){if(50<zn)throw zn=0,Rl=null,Error(w(185));Wn(e,i,n),((A&2)===0||e!==ae)&&(e===ae&&((A&2)===0&&(za|=i),ne===4&&Et(e,le)),ke(e,n),i===1&&A===0&&(t.mode&1)===0&&(Hi=J()+500,Ea&&Ut()))}function ke(e,t){var i=e.callbackNode;Dm(e,t);var n=ea(e,e===ae?le:0);if(n===0)i!==null&&Od(i),e.callbackNode=null,e.callbackPriority=0;else if(t=n&-n,e.callbackPriority!==t){if(i!=null&&Od(i),t===1)e.tag===0?jh(Cp.bind(null,e)):_u(Cp.bind(null,e)),Ph(function(){(A&6)===0&&Ut()}),i=null;else{switch(tu(n)){case 1:i=Ul;break;case 4:i=Zp;break;case 16:i=Jr;break;case 536870912:i=Jp;break;default:i=Jr}i=Ic(i,xc.bind(null,e))}e.callbackPriority=t,e.callbackNode=i}}function xc(e,t){if(Wr=-1,Kr=0,(A&6)!==0)throw Error(w(327));var i=e.callbackNode;if(Ai()&&e.callbackNode!==i)return null;var n=ea(e,e===ae?le:0);if(n===0)return null;if((n&30)!==0||(n&e.expiredLanes)!==0||t)t=va(e,n);else{t=n;var r=A;A|=2;var a=yc();(ae!==e||le!==t)&&(st=null,Hi=J()+500,ii(e,t));do try{ix();break}catch(s){vc(e,s)}while(!0);Jl(),ma.current=a,A=r,te!==null?t=0:(ae=null,le=0,t=ne)}if(t!==0){if(t===2&&(r=nl(e),r!==0&&(n=r,t=Pl(e,r))),t===1)throw i=qn,ii(e,0),Et(e,n),ke(e,J()),i;if(t===6)Et(e,n);else{if(r=e.current.alternate,(n&30)===0&&!ex(r)&&(t=va(e,n),t===2&&(a=nl(e),a!==0&&(n=a,t=Pl(e,a))),t===1))throw i=qn,ii(e,0),Et(e,n),ke(e,J()),i;switch(e.finishedWork=r,e.finishedLanes=n,t){case 0:case 1:throw Error(w(345));case 2:Zt(e,ve,st);break;case 3:if(Et(e,n),(n&130023424)===n&&(t=gs+500-J(),10<t)){if(ea(e,0)!==0)break;if(r=e.suspendedLanes,(r&n)!==n){he(),e.pingedLanes|=e.suspendedLanes&r;break}e.timeoutHandle=ul(Zt.bind(null,e,ve,st),t);break}Zt(e,ve,st);break;case 4:if(Et(e,n),(n&4194240)===n)break;for(t=e.eventTimes,r=-1;0<n;){var o=31-He(n);a=1<<o,o=t[o],o>r&&(r=o),n&=~a}if(n=r,n=J()-n,n=(120>n?120:480>n?480:1080>n?1080:1920>n?1920:3e3>n?3e3:4320>n?4320:1960*Jh(n/1960))-n,10<n){e.timeoutHandle=ul(Zt.bind(null,e,ve,st),n);break}Zt(e,ve,st);break;case 5:Zt(e,ve,st);break;default:throw Error(w(329))}}}return ke(e,J()),e.callbackNode===i?xc.bind(null,e):null}function Pl(e,t){var i=Nn;return e.current.memoizedState.isDehydrated&&(ii(e,t).flags|=256),e=va(e,t),e!==2&&(t=ve,ve=i,t!==null&&Ll(t)),e}function Ll(e){ve===null?ve=e:ve.push.apply(ve,e)}function ex(e){for(var t=e;;){if(t.flags&16384){var i=t.updateQueue;if(i!==null&&(i=i.stores,i!==null))for(var n=0;n<i.length;n++){var r=i[n],a=r.getSnapshot;r=r.value;try{if(!Ge(a(),r))return!1}catch{return!1}}}if(i=t.child,t.subtreeFlags&16384&&i!==null)i.return=t,t=i;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Et(e,t){for(t&=~fs,t&=~za,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var i=31-He(t),n=1<<i;e[i]=-1,t&=~n}}function Cp(e){if((A&6)!==0)throw Error(w(327));Ai();var t=ea(e,0);if((t&1)===0)return ke(e,J()),null;var i=va(e,t);if(e.tag!==0&&i===2){var n=nl(e);n!==0&&(t=n,i=Pl(e,n))}if(i===1)throw i=qn,ii(e,0),Et(e,t),ke(e,J()),i;if(i===6)throw Error(w(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,Zt(e,ve,st),ke(e,J()),null}function ms(e,t){var i=A;A|=1;try{return e(t)}finally{A=i,A===0&&(Hi=J()+500,Ea&&Ut())}}function si(e){Ct!==null&&Ct.tag===0&&(A&6)===0&&Ai();var t=A;A|=1;var i=Oe.transition,n=D;try{if(Oe.transition=null,D=1,e)return e()}finally{D=n,Oe.transition=i,A=t,(A&6)===0&&Ut()}}function hs(){Se=Ri.current,Q(Ri)}function ii(e,t){e.finishedWork=null,e.finishedLanes=0;var i=e.timeoutHandle;if(i!==-1&&(e.timeoutHandle=-1,Rh(i)),te!==null)for(i=te.return;i!==null;){var n=i;switch(Yl(n),n.tag){case 1:n=n.type.childContextTypes,n!=null&&aa();break;case 3:Bi(),Q(be),Q(fe),as();break;case 5:rs(n);break;case 4:Bi();break;case 13:Q(K);break;case 19:Q(K);break;case 10:es(n.type._context);break;case 22:case 23:hs()}i=i.return}if(ae=e,te=e=jt(e.current,null),le=Se=t,ne=0,qn=null,fs=za=li=0,ve=Nn=null,ei!==null){for(t=0;t<ei.length;t++)if(i=ei[t],n=i.interleaved,n!==null){i.interleaved=null;var r=n.next,a=i.pending;if(a!==null){var o=a.next;a.next=r,n.next=o}i.pending=n}ei=null}return e}function vc(e,t){do{var i=te;try{if(Jl(),Qr.current=ga,fa){for(var n=$.memoizedState;n!==null;){var r=n.queue;r!==null&&(r.pending=null),n=n.next}fa=!1}if(oi=0,re=ie=$=null,_n=!1,Hn=0,cs.current=null,i===null||i.return===null){ne=1,qn=t,te=null;break}e:{var a=e,o=i.return,s=i,l=t;if(t=le,s.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){var d=l,c=s,g=c.tag;if((c.mode&1)===0&&(g===0||g===11||g===15)){var h=c.alternate;h?(c.updateQueue=h.updateQueue,c.memoizedState=h.memoizedState,c.lanes=h.lanes):(c.updateQueue=null,c.memoizedState=null)}var v=gp(o);if(v!==null){v.flags&=-257,mp(v,o,s,a,t),v.mode&1&&fp(a,d,t),t=v,l=d;var b=t.updateQueue;if(b===null){var m=new Set;m.add(l),t.updateQueue=m}else b.add(l);break e}else{if((t&1)===0){fp(a,d,t),xs();break e}l=Error(w(426))}}else if(q&&s.mode&1){var S=gp(o);if(S!==null){(S.flags&65536)===0&&(S.flags|=256),mp(S,o,s,a,t),Xl(Vi(l,s));break e}}a=l=Vi(l,s),ne!==4&&(ne=2),Nn===null?Nn=[a]:Nn.push(a),a=o;do{switch(a.tag){case 3:a.flags|=65536,t&=-t,a.lanes|=t;var u=tc(a,l,t);lp(a,u);break e;case 1:s=l;var p=a.type,f=a.stateNode;if((a.flags&128)===0&&(typeof p.getDerivedStateFromError=="function"||f!==null&&typeof f.componentDidCatch=="function"&&(Tt===null||!Tt.has(f)))){a.flags|=65536,t&=-t,a.lanes|=t;var y=ic(a,s,t);lp(a,y);break e}}a=a.return}while(a!==null)}wc(i)}catch(k){t=k,te===i&&i!==null&&(te=i=i.return);continue}break}while(!0)}function yc(){var e=ma.current;return ma.current=ga,e===null?ga:e}function xs(){(ne===0||ne===3||ne===2)&&(ne=4),ae===null||(li&268435455)===0&&(za&268435455)===0||Et(ae,le)}function va(e,t){var i=A;A|=2;var n=yc();(ae!==e||le!==t)&&(st=null,ii(e,t));do try{tx();break}catch(r){vc(e,r)}while(!0);if(Jl(),A=i,ma.current=n,te!==null)throw Error(w(261));return ae=null,le=0,ne}function tx(){for(;te!==null;)bc(te)}function ix(){for(;te!==null&&!zm();)bc(te)}function bc(e){var t=Sc(e.alternate,e,Se);e.memoizedProps=e.pendingProps,t===null?wc(e):te=t,cs.current=null}function wc(e){var t=e;do{var i=t.alternate;if(e=t.return,(t.flags&32768)===0){if(i=Kh(i,t,Se),i!==null){te=i;return}}else{if(i=$h(i,t),i!==null){i.flags&=32767,te=i;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{ne=6,te=null;return}}if(t=t.sibling,t!==null){te=t;return}te=t=e}while(t!==null);ne===0&&(ne=5)}function Zt(e,t,i){var n=D,r=Oe.transition;try{Oe.transition=null,D=1,nx(e,t,i,n)}finally{Oe.transition=r,D=n}return null}function nx(e,t,i,n){do Ai();while(Ct!==null);if((A&6)!==0)throw Error(w(327));i=e.finishedWork;var r=e.finishedLanes;if(i===null)return null;if(e.finishedWork=null,e.finishedLanes=0,i===e.current)throw Error(w(177));e.callbackNode=null,e.callbackPriority=0;var a=i.lanes|i.childLanes;if(Fm(e,a),e===ae&&(te=ae=null,le=0),(i.subtreeFlags&2064)===0&&(i.flags&2064)===0||Fr||(Fr=!0,Ic(Jr,function(){return Ai(),null})),a=(i.flags&15990)!==0,(i.subtreeFlags&15990)!==0||a){a=Oe.transition,Oe.transition=null;var o=D;D=1;var s=A;A|=4,cs.current=null,Xh(e,i),mc(i,e),Eh(dl),ta=!!sl,dl=sl=null,e.current=i,Zh(i,e,r),Rm(),A=s,D=o,Oe.transition=a}else e.current=i;if(Fr&&(Fr=!1,Ct=e,xa=r),a=e.pendingLanes,a===0&&(Tt=null),Tm(i.stateNode,n),ke(e,J()),t!==null)for(n=e.onRecoverableError,i=0;i<t.length;i++)r=t[i],n(r.value,{componentStack:r.stack,digest:r.digest});if(ha)throw ha=!1,e=zl,zl=null,e;return(xa&1)!==0&&e.tag!==0&&Ai(),a=e.pendingLanes,(a&1)!==0?e===Rl?zn++:(zn=0,Rl=e):zn=0,Ut(),null}function Ai(){if(Ct!==null){var e=tu(xa),t=Oe.transition,i=D;try{if(Oe.transition=null,D=16>e?16:e,Ct===null)var n=!1;else{if(e=Ct,Ct=null,xa=0,(A&6)!==0)throw Error(w(331));var r=A;for(A|=4,_=e.current;_!==null;){var a=_,o=a.child;if((_.flags&16)!==0){var s=a.deletions;if(s!==null){for(var l=0;l<s.length;l++){var d=s[l];for(_=d;_!==null;){var c=_;switch(c.tag){case 0:case 11:case 15:Cn(8,c,a)}var g=c.child;if(g!==null)g.return=c,_=g;else for(;_!==null;){c=_;var h=c.sibling,v=c.return;if(cc(c),c===d){_=null;break}if(h!==null){h.return=v,_=h;break}_=v}}}var b=a.alternate;if(b!==null){var m=b.child;if(m!==null){b.child=null;do{var S=m.sibling;m.sibling=null,m=S}while(m!==null)}}_=a}}if((a.subtreeFlags&2064)!==0&&o!==null)o.return=a,_=o;else e:for(;_!==null;){if(a=_,(a.flags&2048)!==0)switch(a.tag){case 0:case 11:case 15:Cn(9,a,a.return)}var u=a.sibling;if(u!==null){u.return=a.return,_=u;break e}_=a.return}}var p=e.current;for(_=p;_!==null;){o=_;var f=o.child;if((o.subtreeFlags&2064)!==0&&f!==null)f.return=o,_=f;else e:for(o=p;_!==null;){if(s=_,(s.flags&2048)!==0)try{switch(s.tag){case 0:case 11:case 15:Na(9,s)}}catch(k){X(s,s.return,k)}if(s===o){_=null;break e}var y=s.sibling;if(y!==null){y.return=s.return,_=y;break e}_=s.return}}if(A=r,Ut(),Ze&&typeof Ze.onPostCommitFiberRoot=="function")try{Ze.onPostCommitFiberRoot(ba,e)}catch{}n=!0}return n}finally{D=i,Oe.transition=t}}return!1}function Np(e,t,i){t=Vi(i,t),t=tc(e,t,1),e=Lt(e,t,1),t=he(),e!==null&&(Wn(e,1,t),ke(e,t))}function X(e,t,i){if(e.tag===3)Np(e,e,i);else for(;t!==null;){if(t.tag===3){Np(t,e,i);break}else if(t.tag===1){var n=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof n.componentDidCatch=="function"&&(Tt===null||!Tt.has(n))){e=Vi(i,e),e=ic(t,e,1),t=Lt(t,e,1),e=he(),t!==null&&(Wn(t,1,e),ke(t,e));break}}t=t.return}}function rx(e,t,i){var n=e.pingCache;n!==null&&n.delete(t),t=he(),e.pingedLanes|=e.suspendedLanes&i,ae===e&&(le&i)===i&&(ne===4||ne===3&&(le&130023424)===le&&500>J()-gs?ii(e,0):fs|=i),ke(e,t)}function kc(e,t){t===0&&((e.mode&1)===0?t=1:(t=Er,Er<<=1,(Er&130023424)===0&&(Er=4194304)));var i=he();e=mt(e,t),e!==null&&(Wn(e,t,i),ke(e,i))}function ax(e){var t=e.memoizedState,i=0;t!==null&&(i=t.retryLane),kc(e,i)}function ox(e,t){var i=0;switch(e.tag){case 13:var n=e.stateNode,r=e.memoizedState;r!==null&&(i=r.retryLane);break;case 19:n=e.stateNode;break;default:throw Error(w(314))}n!==null&&n.delete(t),kc(e,i)}var Sc;Sc=function(e,t,i){if(e!==null)if(e.memoizedProps!==t.pendingProps||be.current)ye=!0;else{if((e.lanes&i)===0&&(t.flags&128)===0)return ye=!1,Wh(e,t,i);ye=(e.flags&131072)!==0}else ye=!1,q&&(t.flags&1048576)!==0&&Cu(t,sa,t.index);switch(t.lanes=0,t.tag){case 2:var n=t.type;qr(e,t),e=t.pendingProps;var r=Di(t,fe.current);ji(t,i),r=ls(null,t,n,e,r,i);var a=ss();return t.flags|=1,typeof r=="object"&&r!==null&&typeof r.render=="function"&&r.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,we(n)?(a=!0,oa(t)):a=!1,t.memoizedState=r.state!==null&&r.state!==void 0?r.state:null,is(t),r.updater=Ca,t.stateNode=r,r._reactInternals=t,vl(t,n,e,i),t=wl(null,t,n,!0,a,i)):(t.tag=0,q&&a&&$l(t),me(null,t,r,i),t=t.child),t;case 16:n=t.elementType;e:{switch(qr(e,t),e=t.pendingProps,r=n._init,n=r(n._payload),t.type=n,r=t.tag=sx(n),e=Ue(n,e),r){case 0:t=bl(null,t,n,e,i);break e;case 1:t=vp(null,t,n,e,i);break e;case 11:t=hp(null,t,n,e,i);break e;case 14:t=xp(null,t,n,Ue(n.type,e),i);break e}throw Error(w(306,n,""))}return t;case 0:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ue(n,r),bl(e,t,n,r,i);case 1:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ue(n,r),vp(e,t,n,r,i);case 3:e:{if(oc(t),e===null)throw Error(w(387));n=t.pendingProps,a=t.memoizedState,r=a.element,Tu(e,t),ua(t,n,null,i);var o=t.memoizedState;if(n=o.element,a.isDehydrated)if(a={element:n,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},t.updateQueue.baseState=a,t.memoizedState=a,t.flags&256){r=Vi(Error(w(423)),t),t=yp(e,t,n,i,r);break e}else if(n!==r){r=Vi(Error(w(424)),t),t=yp(e,t,n,i,r);break e}else for(Ie=Pt(t.stateNode.containerInfo.firstChild),Ee=t,q=!0,Ve=null,i=Pu(t,null,n,i),t.child=i;i;)i.flags=i.flags&-3|4096,i=i.sibling;else{if(Fi(),n===r){t=ht(e,t,i);break e}me(e,t,n,i)}t=t.child}return t;case 5:return Ou(t),e===null&&ml(t),n=t.type,r=t.pendingProps,a=e!==null?e.memoizedProps:null,o=r.children,pl(n,r)?o=null:a!==null&&pl(n,a)&&(t.flags|=32),ac(e,t),me(e,t,o,i),t.child;case 6:return e===null&&ml(t),null;case 13:return lc(e,t,i);case 4:return ns(t,t.stateNode.containerInfo),n=t.pendingProps,e===null?t.child=Ui(t,null,n,i):me(e,t,n,i),t.child;case 11:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ue(n,r),hp(e,t,n,r,i);case 7:return me(e,t,t.pendingProps,i),t.child;case 8:return me(e,t,t.pendingProps.children,i),t.child;case 12:return me(e,t,t.pendingProps.children,i),t.child;case 10:e:{if(n=t.type._context,r=t.pendingProps,a=t.memoizedProps,o=r.value,B(da,n._currentValue),n._currentValue=o,a!==null)if(Ge(a.value,o)){if(a.children===r.children&&!be.current){t=ht(e,t,i);break e}}else for(a=t.child,a!==null&&(a.return=t);a!==null;){var s=a.dependencies;if(s!==null){o=a.child;for(var l=s.firstContext;l!==null;){if(l.context===n){if(a.tag===1){l=ct(-1,i&-i),l.tag=2;var d=a.updateQueue;if(d!==null){d=d.shared;var c=d.pending;c===null?l.next=l:(l.next=c.next,c.next=l),d.pending=l}}a.lanes|=i,l=a.alternate,l!==null&&(l.lanes|=i),hl(a.return,i,t),s.lanes|=i;break}l=l.next}}else if(a.tag===10)o=a.type===t.type?null:a.child;else if(a.tag===18){if(o=a.return,o===null)throw Error(w(341));o.lanes|=i,s=o.alternate,s!==null&&(s.lanes|=i),hl(o,i,t),o=a.sibling}else o=a.child;if(o!==null)o.return=a;else for(o=a;o!==null;){if(o===t){o=null;break}if(a=o.sibling,a!==null){a.return=o.return,o=a;break}o=o.return}a=o}me(e,t,r.children,i),t=t.child}return t;case 9:return r=t.type,n=t.pendingProps.children,ji(t,i),r=je(r),n=n(r),t.flags|=1,me(e,t,n,i),t.child;case 14:return n=t.type,r=Ue(n,t.pendingProps),r=Ue(n.type,r),xp(e,t,n,r,i);case 15:return nc(e,t,t.type,t.pendingProps,i);case 17:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ue(n,r),qr(e,t),t.tag=1,we(n)?(e=!0,oa(t)):e=!1,ji(t,i),ec(t,n,r),vl(t,n,r,i),wl(null,t,n,!0,e,i);case 19:return sc(e,t,i);case 22:return rc(e,t,i)}throw Error(w(156,t.tag))};function Ic(e,t){return Xp(e,t)}function lx(e,t,i,n){this.tag=e,this.key=i,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=n,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Te(e,t,i,n){return new lx(e,t,i,n)}function vs(e){return e=e.prototype,!(!e||!e.isReactComponent)}function sx(e){if(typeof e=="function")return vs(e)?1:0;if(e!=null){if(e=e.$$typeof,e===Ml)return 11;if(e===Dl)return 14}return 2}function jt(e,t){var i=e.alternate;return i===null?(i=Te(e.tag,t,e.key,e.mode),i.elementType=e.elementType,i.type=e.type,i.stateNode=e.stateNode,i.alternate=e,e.alternate=i):(i.pendingProps=t,i.type=e.type,i.flags=0,i.subtreeFlags=0,i.deletions=null),i.flags=e.flags&14680064,i.childLanes=e.childLanes,i.lanes=e.lanes,i.child=e.child,i.memoizedProps=e.memoizedProps,i.memoizedState=e.memoizedState,i.updateQueue=e.updateQueue,t=e.dependencies,i.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},i.sibling=e.sibling,i.index=e.index,i.ref=e.ref,i}function $r(e,t,i,n,r,a){var o=2;if(n=e,typeof e=="function")vs(e)&&(o=1);else if(typeof e=="string")o=5;else e:switch(e){case bi:return ni(i.children,r,a,t);case Al:o=8,r|=8;break;case Vo:return e=Te(12,i,t,r|2),e.elementType=Vo,e.lanes=a,e;case Ho:return e=Te(13,i,t,r),e.elementType=Ho,e.lanes=a,e;case Qo:return e=Te(19,i,t,r),e.elementType=Qo,e.lanes=a,e;case Op:return Ra(i,r,a,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Lp:o=10;break e;case Tp:o=9;break e;case Ml:o=11;break e;case Dl:o=14;break e;case kt:o=16,n=null;break e}throw Error(w(130,e==null?e:typeof e,""))}return t=Te(o,i,t,r),t.elementType=e,t.type=n,t.lanes=a,t}function ni(e,t,i,n){return e=Te(7,e,n,t),e.lanes=i,e}function Ra(e,t,i,n){return e=Te(22,e,n,t),e.elementType=Op,e.lanes=i,e.stateNode={isHidden:!1},e}function Fo(e,t,i){return e=Te(6,e,null,t),e.lanes=i,e}function Uo(e,t,i){return t=Te(4,e.children!==null?e.children:[],e.key,t),t.lanes=i,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function dx(e,t,i,n,r){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=So(0),this.expirationTimes=So(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=So(0),this.identifierPrefix=n,this.onRecoverableError=r,this.mutableSourceEagerHydrationData=null}function ys(e,t,i,n,r,a,o,s,l){return e=new dx(e,t,i,s,l),t===1?(t=1,a===!0&&(t|=8)):t=0,a=Te(3,null,null,t),e.current=a,a.stateNode=e,a.memoizedState={element:n,isDehydrated:i,cache:null,transitions:null,pendingSuspenseBoundaries:null},is(a),e}function px(e,t,i){var n=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:yi,key:n==null?null:""+n,children:e,containerInfo:t,implementation:i}}function Ec(e){if(!e)return Mt;e=e._reactInternals;e:{if(pi(e)!==e||e.tag!==1)throw Error(w(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(we(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(w(171))}if(e.tag===1){var i=e.type;if(we(i))return Eu(e,i,t)}return t}function _c(e,t,i,n,r,a,o,s,l){return e=ys(i,n,!0,e,r,a,o,s,l),e.context=Ec(null),i=e.current,n=he(),r=Ot(i),a=ct(n,r),a.callback=t??null,Lt(i,a,r),e.current.lanes=r,Wn(e,r,n),ke(e,n),e}function Pa(e,t,i,n){var r=t.current,a=he(),o=Ot(r);return i=Ec(i),t.context===null?t.context=i:t.pendingContext=i,t=ct(a,o),t.payload={element:e},n=n===void 0?null:n,n!==null&&(t.callback=n),e=Lt(r,t,o),e!==null&&(Qe(e,r,o,a),Hr(e,r,o)),o}function ya(e){return e=e.current,e.child?(e.child.tag===5,e.child.stateNode):null}function zp(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var i=e.retryLane;e.retryLane=i!==0&&i<t?i:t}}function bs(e,t){zp(e,t),(e=e.alternate)&&zp(e,t)}function ux(){return null}var Cc=typeof reportError=="function"?reportError:function(e){console.error(e)};function ws(e){this._internalRoot=e}La.prototype.render=ws.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(w(409));Pa(e,t,null,null)};La.prototype.unmount=ws.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;si(function(){Pa(null,e,null,null)}),t[gt]=null}};function La(e){this._internalRoot=e}La.prototype.unstable_scheduleHydration=function(e){if(e){var t=ru();e={blockedOn:null,target:e,priority:t};for(var i=0;i<It.length&&t!==0&&t<It[i].priority;i++);It.splice(i,0,e),i===0&&ou(e)}};function ks(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Ta(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function Rp(){}function cx(e,t,i,n,r){if(r){if(typeof n=="function"){var a=n;n=function(){var d=ya(o);a.call(d)}}var o=_c(t,n,e,0,null,!1,!1,"",Rp);return e._reactRootContainer=o,e[gt]=o.current,Dn(e.nodeType===8?e.parentNode:e),si(),o}for(;r=e.lastChild;)e.removeChild(r);if(typeof n=="function"){var s=n;n=function(){var d=ya(l);s.call(d)}}var l=ys(e,0,!1,null,null,!1,!1,"",Rp);return e._reactRootContainer=l,e[gt]=l.current,Dn(e.nodeType===8?e.parentNode:e),si(function(){Pa(t,l,i,n)}),l}function Oa(e,t,i,n,r){var a=i._reactRootContainer;if(a){var o=a;if(typeof r=="function"){var s=r;r=function(){var l=ya(o);s.call(l)}}Pa(t,o,e,r)}else o=cx(i,t,e,r,n);return ya(o)}iu=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var i=yn(t.pendingLanes);i!==0&&(Bl(t,i|1),ke(t,J()),(A&6)===0&&(Hi=J()+500,Ut()))}break;case 13:si(function(){var n=mt(e,1);if(n!==null){var r=he();Qe(n,e,1,r)}}),bs(e,1)}};Vl=function(e){if(e.tag===13){var t=mt(e,134217728);if(t!==null){var i=he();Qe(t,e,134217728,i)}bs(e,134217728)}};nu=function(e){if(e.tag===13){var t=Ot(e),i=mt(e,t);if(i!==null){var n=he();Qe(i,e,t,n)}bs(e,t)}};ru=function(){return D};au=function(e,t){var i=D;try{return D=e,t()}finally{D=i}};el=function(e,t,i){switch(t){case"input":if(Wo(e,i),t=i.name,i.type==="radio"&&t!=null){for(i=e;i.parentNode;)i=i.parentNode;for(i=i.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<i.length;t++){var n=i[t];if(n!==e&&n.form===e.form){var r=Ia(n);if(!r)throw Error(w(90));Ap(n),Wo(n,r)}}}break;case"textarea":Dp(e,i);break;case"select":t=i.value,t!=null&&Pi(e,!!i.multiple,t,!1)}};Gp=ms;qp=si;var fx={usingClientEntryPoint:!1,Events:[$n,Ii,Ia,Hp,Qp,ms]},mn={findFiberByHostInstance:Jt,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},gx={bundleType:mn.bundleType,version:mn.version,rendererPackageName:mn.rendererPackageName,rendererConfig:mn.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:xt.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=$p(e),e===null?null:e.stateNode},findFiberByHostInstance:mn.findFiberByHostInstance||ux,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(hn=__REACT_DEVTOOLS_GLOBAL_HOOK__,!hn.isDisabled&&hn.supportsFiber))try{ba=hn.inject(gx),Ze=hn}catch{}var hn;Ne.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=fx;Ne.createPortal=function(e,t){var i=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!ks(t))throw Error(w(200));return px(e,t,null,i)};Ne.createRoot=function(e,t){if(!ks(e))throw Error(w(299));var i=!1,n="",r=Cc;return t!=null&&(t.unstable_strictMode===!0&&(i=!0),t.identifierPrefix!==void 0&&(n=t.identifierPrefix),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=ys(e,1,!1,null,null,i,!1,n,r),e[gt]=t.current,Dn(e.nodeType===8?e.parentNode:e),new ws(t)};Ne.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(w(188)):(e=Object.keys(e).join(","),Error(w(268,e)));return e=$p(t),e=e===null?null:e.stateNode,e};Ne.flushSync=function(e){return si(e)};Ne.hydrate=function(e,t,i){if(!Ta(t))throw Error(w(200));return Oa(null,e,t,!0,i)};Ne.hydrateRoot=function(e,t,i){if(!ks(e))throw Error(w(405));var n=i!=null&&i.hydratedSources||null,r=!1,a="",o=Cc;if(i!=null&&(i.unstable_strictMode===!0&&(r=!0),i.identifierPrefix!==void 0&&(a=i.identifierPrefix),i.onRecoverableError!==void 0&&(o=i.onRecoverableError)),t=_c(t,null,e,1,i??null,r,!1,a,o),e[gt]=t.current,Dn(e),n)for(e=0;e<n.length;e++)i=n[e],r=i._getVersion,r=r(i._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[i,r]:t.mutableSourceEagerHydrationData.push(i,r);return new La(t)};Ne.render=function(e,t,i){if(!Ta(t))throw Error(w(200));return Oa(null,e,t,!1,i)};Ne.unmountComponentAtNode=function(e){if(!Ta(e))throw Error(w(40));return e._reactRootContainer?(si(function(){Oa(null,null,e,!1,function(){e._reactRootContainer=null,e[gt]=null})}),!0):!1};Ne.unstable_batchedUpdates=ms;Ne.unstable_renderSubtreeIntoContainer=function(e,t,i,n){if(!Ta(i))throw Error(w(200));if(e==null||e._reactInternals===void 0)throw Error(w(38));return Oa(e,t,i,!1,n)};Ne.version="18.3.1-next-f1338f8080-20240426"});var Ss=lt((ev,Rc)=>{"use strict";function zc(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(zc)}catch(e){console.error(e)}}zc(),Rc.exports=Nc()});var Lc=lt(Is=>{"use strict";var Pc=Ss();Is.createRoot=Pc.createRoot,Is.hydrateRoot=Pc.hydrateRoot;var tv});var Fc=lt(ja=>{"use strict";var mx=V(),hx=Symbol.for("react.element"),xx=Symbol.for("react.fragment"),vx=Object.prototype.hasOwnProperty,yx=mx.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,bx={key:!0,ref:!0,__self:!0,__source:!0};function Dc(e,t,i){var n,r={},a=null,o=null;i!==void 0&&(a=""+i),t.key!==void 0&&(a=""+t.key),t.ref!==void 0&&(o=t.ref);for(n in t)vx.call(t,n)&&!bx.hasOwnProperty(n)&&(r[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps,t)r[n]===void 0&&(r[n]=t[n]);return{$$typeof:hx,type:e,key:a,ref:o,props:r,_owner:yx.current}}ja.Fragment=xx;ja.jsx=Dc;ja.jsxs=Dc});var L=lt((av,Uc)=>{"use strict";Uc.exports=Fc()});var Mg=I(Lc(),1);var Es={representative_test_set:"\u4EE3\u8868\u6027\u6D4B\u8BD5\u96C6",ordinary_normal:"\u666E\u901A\u6B63\u5E38",hard_normal:"\u56F0\u96BE\u826F\u54C1",near_ok_ng_pair:"\u76F8\u4F3C\u5F02\u6807\u7B7E\u5BF9",tiny_defect:"\u5FAE\u5C0F\u5F02\u5E38",low_contrast_defect:"\u4F4E\u5BF9\u6BD4\u5F02\u5E38",structural_relation:"\u7ED3\u6784\u5173\u7CFB",missing_component:"\u7F3A\u5931",misalignment:"\u9519\u4F4D",multi_object:"\u591A\u4EF6\u4E0E\u591A\u5B9E\u4F8B",in_domain:"\u539F\u57DF",unseen_batch:"\u672A\u89C1\u6279\u6B21",lighting_shift:"\u5149\u7167\u53D8\u5316"},Tc={observed:"\u5DF2\u89C2\u5BDF\u5230",candidate:"\u80FD\u529B\u5019\u9009",not_observed:"\u672A\u89C2\u5BDF\u5230",not_applicable:"\u4E0D\u9002\u7528"},Oc={pending:"\u5F85\u9A8C\u8BC1",supported:"\u6709\u652F\u6301",disputed:"\u5B58\u5728\u5206\u6B67",withdrawn:"\u5DF2\u64A4\u56DE"},jc={exploration:"\u89C6\u89C9\u63A2\u7D22",training_experiment:"\u8BAD\u7EC3\u5B9E\u9A8C",debug:"\u5185\u90E8\u8C03\u8BD5",image_evaluation:"\u56FE\u50CF\u7EA7\u8BC4\u6D4B",bbox_evaluation:"\u6846\u7EA7\u8BC4\u6D4B",pixel_evaluation:"\u50CF\u7D20\u7EA7\u8BC4\u6D4B",formal_benchmark:"\u6B63\u5F0F Benchmark"},Ac={usable:"\u53EF\u7528",candidate:"\u53EF\u4F5C\u5019\u9009",not_ready:"\u6761\u4EF6\u4E0D\u8DB3",not_evaluated:"\u672A\u8BC4\u4EF7"},_s={ready:"\u5C31\u7EEA",partial:"\u90E8\u5206\u6761\u4EF6\u6EE1\u8DB3",not_ready:"\u6761\u4EF6\u4E0D\u8DB3",not_evaluated:"\u672A\u8BC4\u4EF7"};var Cs={image_label_mismatch:"\u7C7B\u522B\u4E0D\u4E00\u81F4",category_mismatch:"\u7C7B\u522B\u4E0D\u4E00\u81F4",extra_annotation:"\u591A\u6807",missing_annotation:"\u5C11\u6807",position_difference:"\u4F4D\u7F6E\u5DEE\u5F02",split:"\u62C6\u5206",merge:"\u5408\u5E76"},Mc={labelme:["category_mismatch","extra_annotation","missing_annotation","position_difference","split","merge"],folder_classification:["image_label_mismatch"]};var gi=I(V(),1);var Nf=I(V(),1);var _f=I(V(),1);var Qt=I(V(),1);var Bt=I(V(),1),et=I(L(),1),Bc=(0,Bt.createContext)(0);function Aa({children:e,className:t="",primarySource:i}){let[n,r]=(0,Bt.useState)(0),[a,o]=(0,Bt.useState)(new Map),[s,l]=(0,Bt.useState)(""),d=!!i&&i!==s;function c(g){let h=g.target,v=h.getAttribute?.("data-media-source");v&&(v===i&&l(v),o(b=>{let m=new Map(b);return g.type==="error"?m.set(v,h.getAttribute("data-media-label")||h.getAttribute("alt")||"\u56FE\u50CF"):m.delete(v),m}))}return(0,et.jsx)(Bc.Provider,{value:n,children:(0,et.jsxs)("div",{className:`iad-media-load ${t}`,"aria-busy":i?d:void 0,onErrorCapture:c,onLoadCapture:c,children:[e,d&&(0,et.jsx)("div",{className:"iad-media-loading",role:"status",children:"\u6B63\u5728\u52A0\u8F7D\u56FE\u50CF\u2026"}),!!a.size&&(0,et.jsxs)("div",{className:"iad-media-error",role:"alert",children:[[...new Set(a.values())].map(g=>(0,et.jsxs)("span",{children:[g,"\u65E0\u6CD5\u52A0\u8F7D\uFF0C\u8BF7\u68C0\u67E5\u8D44\u6E90\u662F\u5426\u5B58\u5728\u6216\u5B8C\u6574\u3002"]},g)),(0,et.jsx)("button",{type:"button","aria-label":"\u91CD\u65B0\u52A0\u8F7D\u56FE\u50CF",onClick:()=>{l(""),o(new Map),r(g=>g+1)},children:"\u91CD\u65B0\u52A0\u8F7D"})]})]})})}function Vc(e){let t=(0,Bt.useContext)(Bc);if(!t)return e;let i=new URL(e,window.location.href);return i.searchParams.set("_retry",String(t)),i.href}function qi({src:e="",...t}){return(0,et.jsx)("img",{...t,src:Vc(e),"data-media-source":e})}function Hc({href:e="",...t}){return(0,et.jsx)("image",{...t,href:Vc(e),"data-media-source":e,"data-media-label":"\u6807\u6CE8\u50CF\u7D20"})}var Xn=I(V(),1),wx=I(L(),1),kx=Xn.createContext(void 0),Qc=e=>{let t=Xn.useContext(kx);if(e)return e;if(!t)throw new Error("No QueryClient set, use QueryClientProvider to set one");return t};var Sx={setTimeout:(e,t)=>setTimeout(e,t),clearTimeout:e=>clearTimeout(e),setInterval:(e,t)=>setInterval(e,t),clearInterval:e=>clearInterval(e)},Ix=class{#e=Sx;#t=!1;setTimeoutProvider(e){this.#e=e}setTimeout(e,t){return this.#e.setTimeout(e,t)}clearTimeout(e){this.#e.clearTimeout(e)}setInterval(e,t){return this.#e.setInterval(e,t)}clearInterval(e){this.#e.clearInterval(e)}},tt=new Ix;function Gc(e){setTimeout(e,0)}var zs=typeof window>"u"||"Deno"in globalThis;function ee(){}function Kc(e,t){return typeof e=="function"?e(t):e}function Ma(e){return typeof e=="number"&&e>=0&&e!==1/0}function Da(e,t){return Math.max(e+(t||0)-Date.now(),0)}function F(e,t){return typeof e=="function"?e(t):e}function Fa(e,t){let{type:i="all",exact:n,fetchStatus:r,predicate:a,queryKey:o,stale:s}=e;if(o){if(n){if(t.queryHash!==Zn(o,t.options))return!1}else if(!Vt(t.queryKey,o))return!1}if(i!=="all"){let l=t.isActive();if(i==="active"&&!l||i==="inactive"&&l)return!1}return!(typeof s=="boolean"&&t.isStale()!==s||r&&r!==t.state.fetchStatus||a&&!a(t))}function Ua(e,t){let{exact:i,status:n,predicate:r,mutationKey:a}=e;if(a){if(!t.options.mutationKey)return!1;if(i){if(ui(t.options.mutationKey)!==ui(a))return!1}else if(!Vt(t.options.mutationKey,a))return!1}return!(n&&t.state.status!==n||r&&!r(t))}function Zn(e,t){return(t?.queryKeyHashFn||ui)(e)}function ui(e){return JSON.stringify(e,(t,i)=>Ns(i)?Object.keys(i).sort().reduce((n,r)=>(n[r]=i[r],n),{}):i)}function Vt(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(e&&t&&typeof e=="object"&&typeof t=="object"){if(Array.isArray(e)&&Array.isArray(t)){if(t.length>e.length)return!1;for(let n=0;n<t.length;n++)if(!Vt(e[n],t[n]))return!1;return!0}let i=Object.keys(t);for(let n of i)if(!Vt(e[n],t[n]))return!1;return!0}return!1}var $c=Object.prototype.hasOwnProperty;function Rs(e,t,i=0){if(e===t)return e;if(i>500)return t;let n=qc(e)&&qc(t);if(!n&&!(Ns(e)&&Ns(t)))return t;let r=(n?e:Object.keys(e)).length,a=n?t:Object.keys(t),o=a.length,s=n?new Array(o):{},l=0;for(let d=0;d<o;d++){let c=n?d:a[d],g=e[c],h=t[c];if(g===h){s[c]=g,(n?d<r:$c.call(e,c))&&l++;continue}if(g===null||h===null||typeof g!="object"||typeof h!="object"){s[c]=h;continue}let v=Rs(g,h,i+1);s[c]=v,v===g&&l++}return r===o&&l===r?e:s}function Ba(e,t){if(!t||Object.keys(e).length!==Object.keys(t).length)return!1;for(let i of Object.keys(e))if(!$c.call(t,i)||e[i]!==t[i])return!1;return!0}function qc(e){return Array.isArray(e)&&e.length===Object.keys(e).length}function Ns(e){if(!Wc(e))return!1;let t=Object.getPrototypeOf(e),i=t?.constructor;if(i===void 0)return!0;if(typeof i!="function")return!1;let n=i.prototype;return!(!Wc(n)||!n.hasOwnProperty("isPrototypeOf")||t!==Object.prototype)}function Wc(e){return Object.prototype.toString.call(e)==="[object Object]"}function Yc(e){return new Promise(t=>{tt.setTimeout(t,e)})}function Jn(e,t,i){return typeof i.structuralSharing=="function"?i.structuralSharing(e,t):i.structuralSharing!==!1?Rs(e,t):t}function Xc(e,t,i=0){let n=[...e,t];return i&&n.length>i?n.slice(-i):n}function Zc(e,t,i=0){let n=[t,...e];return i&&n.length>i?n.slice(0,i):n}var Wi=Symbol();function Va(e,t){return!e.queryFn&&t?.initialPromise?()=>t.initialPromise:!e.queryFn||e.queryFn===Wi?()=>Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)):e.queryFn}function Ha(e,t){return typeof e=="function"?e(...t):!!e}var er=Symbol();function Jc(e,t,i,n){let r=!1,a;return Object.defineProperties(e,{[er]:{value:n},signal:{enumerable:!0,get:()=>(a??=t(),r||(r=!0,a.aborted?i():a.addEventListener("abort",i,{once:!0})),a)}}),e}var Ex=()=>zs,Ki=()=>Ex();var it=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(e){return this.listeners.add(e),this.onSubscribe(),()=>{this.listeners.delete(e),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}};var _x=class extends it{#e;#t;#i;constructor(){super(),this.#i=e=>{if(typeof window<"u"&&window.addEventListener){let t=()=>e();return window.addEventListener("visibilitychange",t,!1),()=>{window.removeEventListener("visibilitychange",t)}}}}onSubscribe(){this.#t||this.setEventListener(this.#i)}onUnsubscribe(){this.hasListeners()||(this.#t?.(),this.#t=void 0)}setEventListener(e){this.#i=e,this.#t?.(),this.#t=e(t=>{typeof t=="boolean"?this.setFocused(t):this.onFocus()})}setFocused(e){this.#e!==e&&(this.#e=e,this.onFocus())}onFocus(){let e=this.isFocused();this.listeners.forEach(t=>{t(e)})}isFocused(){return typeof this.#e=="boolean"?this.#e:globalThis.document?.visibilityState!=="hidden"}},$i=new _x;var ef=Gc;function Cx(){let e=[],t=0,i=s=>{s()},n=s=>{s()},r=ef,a=s=>{t?e.push(s):r(()=>{i(s)})},o=()=>{let s=e;e=[],s.length&&r(()=>{n(()=>{s.forEach(l=>{i(l)})})})};return{batch:s=>{let l;t++;try{l=s()}finally{t--,t||o()}return l},batchCalls:s=>(...l)=>{a(()=>{s(...l)})},schedule:a,setNotifyFunction:s=>{i=s},setBatchNotifyFunction:s=>{n=s},setScheduler:s=>{r=s}}}var G=Cx();var Nx=class extends it{#e=!0;#t;#i;constructor(){super(),this.#i=e=>{if(typeof window<"u"&&window.addEventListener){let t=()=>e(!0),i=()=>e(!1);return window.addEventListener("online",t,!1),window.addEventListener("offline",i,!1),()=>{window.removeEventListener("online",t),window.removeEventListener("offline",i)}}}}onSubscribe(){this.#t||this.setEventListener(this.#i)}onUnsubscribe(){this.hasListeners()||(this.#t?.(),this.#t=void 0)}setEventListener(e){this.#i=e,this.#t?.(),this.#t=e(this.setOnline.bind(this))}setOnline(e){this.#e!==e&&(this.#e=e,this.listeners.forEach(t=>{t(e)}))}isOnline(){return this.#e}},Yi=new Nx;function zx(e){return Math.min(1e3*2**e,3e4)}function Ps(e){return(e??"online")==="online"?Yi.isOnline():!0}var Qa=class extends Error{constructor(e){super("CancelledError"),this.revert=e?.revert,this.silent=e?.silent}};function Ga(e){let t=!1,i=0,n,r="pending",a,o,s=new Promise((p,f)=>{a=p,o=f});s.catch(ee);let l=()=>r!=="pending",d=p=>{if(!l()){let f=new Qa(p);m(f),e.onCancel?.(f)}},c=()=>{t=!0},g=()=>{t=!1},h=()=>$i.isFocused()&&(e.networkMode==="always"||Yi.isOnline())&&e.canRun(),v=()=>Ps(e.networkMode)&&e.canRun(),b=p=>{l()||(n?.(),r="resolved",a(p))},m=p=>{l()||(n?.(),r="rejected",o(p))},S=p=>new Promise(f=>{n=y=>{(l()||p())&&f(y)},e.onPause?.()}).then(()=>{n=void 0,l()||e.onContinue?.()}),u=()=>{if(l())return;let p,f=i===0?e.initialPromise:void 0;try{p=f??e.fn()}catch(y){p=Promise.reject(y)}Promise.resolve(p).then(b).catch(y=>{if(l())return;let k=e.retry??(Ki()?0:3),E=e.retryDelay??zx,N=typeof E=="function"?E(i,y):E,P=k===!0||typeof k=="number"&&i<k||typeof k=="function"&&k(i,y);if(t||!P){m(y);return}i++,e.onFail?.(i,y),Yc(N).then(()=>l()||h()?void 0:S(h)).then(()=>{t?m(y):u()})})};return{promise:s,status:()=>r,cancel:d,continue:()=>(n?.(),s),cancelRetry:c,continueRetry:g,canStart:v,start:()=>(v()?u():S(v).then(u),s)}}var qa=class{#e;destroy(){this.clearGcTimeout()}scheduleGc(){this.clearGcTimeout(),Ma(this.gcTime)&&(this.#e=tt.setTimeout(()=>{this.optionalRemove()},this.gcTime))}updateGcTime(e){this.gcTime=Math.max(this.gcTime||0,e??(Ki()?1/0:3e5))}clearGcTimeout(){this.#e!==void 0&&(tt.clearTimeout(this.#e),this.#e=void 0)}};function nf(e){return{onFetch:(t,i)=>{let n=t.options,r=t.fetchOptions?.meta?.fetchMore?.direction,a=t.state.data?.pages||[],o=t.state.data?.pageParams||[],s={pages:[],pageParams:[]},l=0,d=async()=>{let c=!1,g=t,h=m=>{Jc(m,()=>t.signal,()=>c=!0,g[er])},v=Va(t.options,t.fetchOptions),b=async(m,S,u)=>{if(c)return Promise.reject(t.signal.reason);if(S==null&&m.pages.length)return Promise.resolve(m);let f=(()=>{let N={client:t.client,queryKey:t.queryKey,pageParam:S,direction:u?"backward":"forward",meta:t.options.meta};return h(N),N})(),y=await v(f),{maxPages:k}=t.options,E=u?Zc:Xc;return{pages:E(m.pages,y,k),pageParams:E(m.pageParams,S,k)}};if(r&&a.length){let m=r==="backward",S=m?Rx:tf,u={pages:a,pageParams:o};s=await b(u,S(n,u),m)}else{let m=e??a.length;do{let S=l===0?o[0]===void 0?n.initialPageParam:o[0]:tf(n,s);if(l>0&&S==null)break;s=await b(s,S),l++}while(l<m)}return s};t.options.persister?t.fetchFn=()=>t.options.persister?.(d,{client:t.client,queryKey:t.queryKey,meta:t.options.meta,signal:t.signal},i):t.fetchFn=d}}}function tf(e,{pages:t,pageParams:i}){let n=t.length-1;return t.length>0?e.getNextPageParam(t[n],t,i[n],i):void 0}function Rx(e,{pages:t,pageParams:i}){return t.length>0?e.getPreviousPageParam?.(t[0],t,i[0],i):void 0}var of=class extends qa{#e;#t;#i;#n;#a;#r;#o;#s;#d;constructor(e){super(),this.#d=!1,this.#s=e.defaultOptions,this.setOptions(e.options),this.observers=[],this.#a=e.client,this.#n=this.#a.getQueryCache(),this.queryKey=e.queryKey,this.queryHash=e.queryHash,this.#t=af(this.options),this.state=e.state??this.#t,this.scheduleGc()}get meta(){return this.options.meta}get queryType(){return this.#e}get promise(){return this.#r?.promise}setOptions(e){if(this.options={...this.#s,...e},e?._type&&(this.#e=e._type),this.updateGcTime(this.options.gcTime),this.state&&this.state.data===void 0){let t=af(this.options);t.data!==void 0&&(this.setState(rf(t.data,t.dataUpdatedAt)),this.#t=t)}}optionalRemove(){!this.observers.length&&this.state.fetchStatus==="idle"&&this.#n.remove(this)}setData(e,t){let i=Jn(this.state.data,e,this.options);return this.#l({data:i,type:"success",dataUpdatedAt:t?.updatedAt,manual:t?.manual}),i}setState(e){this.#l({type:"setState",state:e})}cancel(e){let t=this.#r?.promise;return this.#r?.cancel(e),t?t.then(ee).catch(ee):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}get resetState(){return this.#t}reset(){this.destroy(),this.setState(this.resetState)}isActive(){return this.observers.some(e=>F(e.options.enabled,this)!==!1)}isDisabled(){return this.getObserversCount()>0?!this.isActive():this.options.queryFn===Wi||!this.isFetched()}isFetched(){return this.state.dataUpdateCount+this.state.errorUpdateCount>0}isStatic(){return this.state.data===void 0?!1:this.getObserversCount()>0?this.observers.some(e=>F(e.options.staleTime,this)==="static"):!1}isStale(){return this.getObserversCount()>0?this.observers.some(e=>e.getCurrentResult().isStale):this.state.data===void 0||this.state.isInvalidated}isStaleByTime(e=0){return this.state.data===void 0?!0:e==="static"?!1:this.state.isInvalidated?!0:!Da(this.state.dataUpdatedAt,e)}onFocus(){this.observers.find(e=>e.shouldFetchOnWindowFocus())?.refetch({cancelRefetch:!1}),this.#r?.continue()}onOnline(){this.observers.find(e=>e.shouldFetchOnReconnect())?.refetch({cancelRefetch:!1}),this.#r?.continue()}addObserver(e){this.observers.includes(e)||(this.observers.push(e),this.clearGcTimeout(),this.#n.notify({type:"observerAdded",query:this,observer:e}))}removeObserver(e){let t=this.observers.indexOf(e);t!==-1&&(this.observers.splice(t,1),this.observers.length||(this.#r&&(this.#d||this.state.fetchStatus==="paused"&&this.state.status==="pending"?this.#r.cancel({revert:!0}):this.#r.cancelRetry()),this.scheduleGc()),this.#n.notify({type:"observerRemoved",query:this,observer:e}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||this.#l({type:"invalidate"})}async fetch(e,t){if(this.state.fetchStatus!=="idle"&&this.#r?.status()!=="rejected"){if(this.state.data!==void 0&&t?.cancelRefetch)this.cancel({silent:!0});else if(this.#r&&this.#o)return this.#r.continueRetry(),this.#o}if(e&&this.setOptions(e),!this.options.queryFn){let d=this.observers.find(c=>c.options.queryFn);d&&this.setOptions(d.options)}let i=new AbortController,n=d=>{Object.defineProperties(d,{[er]:{value:i.signal,enumerable:!0},signal:{enumerable:!0,get:()=>(this.#d=!0,i.signal)}})},r=()=>{let d=Va(this.options,t),g=(()=>{let h={client:this.#a,queryKey:this.queryKey,meta:this.meta};return n(h),h})();return this.#d=!1,this.options.persister?this.options.persister(d,g,this):d(g)},o=(()=>{let d={fetchOptions:t,options:this.options,queryKey:this.queryKey,client:this.#a,state:this.state,fetchFn:r};return n(d),d})();(this.#e==="infinite"?nf(this.options.pages):this.options.behavior)?.onFetch(o,this),this.#i=this.state,(this.state.fetchStatus==="idle"||this.state.fetchMeta!==o.fetchOptions?.meta)&&this.#l({type:"fetch",meta:o.fetchOptions?.meta});let s=this.#r=Ga({initialPromise:t?.initialPromise,fn:o.fetchFn,onCancel:d=>{d instanceof Qa&&d.revert&&this.setState({...this.#i,fetchStatus:"idle"}),i.abort()},onFail:(d,c)=>{this.#l({type:"failed",failureCount:d,error:c})},onPause:()=>{this.#l({type:"pause"})},onContinue:()=>{this.#l({type:"continue"})},retry:o.options.retry,retryDelay:o.options.retryDelay,networkMode:o.options.networkMode,canRun:()=>!0}),l=(async()=>{try{let d=await s.promise;if(d===void 0)throw new Error(`${this.queryHash} data is undefined`);return this.setData(d),this.#n.config.onSuccess?.(d,this),this.#n.config.onSettled?.(d,this.state.error,this),d}catch(d){if(d instanceof Qa){if(d.silent){if(this.#r!==s&&this.#o)return this.#o;throw d}else if(d.revert){if(this.state.data===void 0)throw d;return this.state.data}}throw this.#l({type:"error",error:d}),this.#n.config.onError?.(d,this),this.#n.config.onSettled?.(this.state.data,d,this),d}finally{this.#r===s&&(this.#r=void 0,this.#o=void 0),this.scheduleGc()}})();return this.#o=l,s.start(),l}#l(e){let t=i=>{switch(e.type){case"failed":return{...i,fetchFailureCount:e.failureCount,fetchFailureReason:e.error};case"pause":return{...i,fetchStatus:"paused"};case"continue":return{...i,fetchStatus:"fetching"};case"fetch":return{...i,...Ls(i.data,this.options),fetchMeta:e.meta??null};case"success":let n={...i,...rf(e.data,e.dataUpdatedAt),dataUpdateCount:i.dataUpdateCount+1,...!e.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};return this.#i=e.manual?n:void 0,n;case"error":let r=e.error;return{...i,error:r,errorUpdateCount:i.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:i.fetchFailureCount+1,fetchFailureReason:r,fetchStatus:"idle",status:"error",isInvalidated:!0};case"invalidate":return{...i,isInvalidated:!0};case"setState":return{...i,...e.state}}};this.state=t(this.state),G.batch(()=>{this.observers.slice().forEach(i=>{i.onQueryUpdate()}),this.#n.notify({query:this,type:"updated",action:e})})}};function Ls(e,t){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:Ps(t.networkMode)?"fetching":"paused",...e===void 0&&{error:null,status:"pending"}}}function rf(e,t){return{data:e,dataUpdatedAt:t??Date.now(),error:null,isInvalidated:!1,status:"success"}}function af(e){let t=typeof e.initialData=="function"?e.initialData():e.initialData,i=t!==void 0,n=i?typeof e.initialDataUpdatedAt=="function"?e.initialDataUpdatedAt():e.initialDataUpdatedAt:0;return{data:t,dataUpdateCount:0,dataUpdatedAt:i?n??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:i?"success":"pending",fetchStatus:"idle"}}var Os=class extends it{#e;#t=void 0;#i=void 0;#n=void 0;#a;#r;#o;#s;#d;#l;#u;#c;#p;#g=new Set;constructor(e,t){super(),this.options=t,this.#e=e,this.#o=null,this.bindMethods(),this.setOptions(t)}bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(this.#t.addObserver(this),lf(this.#t,this.options)?this.#f():this.updateResult(),this.#y())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return Ts(this.#t,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return Ts(this.#t,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#b(),this.#w(),this.#t.removeObserver(this)}setOptions(e){let t=this.options,i=this.#t;if(this.options=this.#e.defaultQueryOptions(e),this.options.enabled!==void 0&&typeof this.options.enabled!="boolean"&&typeof this.options.enabled!="function"&&typeof F(this.options.enabled,this.#t)!="boolean")throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");this.#k(),this.#t.setOptions(this.options),t._defaulted&&!Ba(this.options,t)&&this.#e.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#t,observer:this});let n=this.hasListeners();n&&sf(this.#t,i,this.options,t)&&this.#f(),this.updateResult(),n&&(this.#t!==i||F(this.options.enabled,this.#t)!==F(t.enabled,this.#t)||F(this.options.staleTime,this.#t)!==F(t.staleTime,this.#t))&&this.#h();let r=this.#x();n&&(this.#t!==i||F(this.options.enabled,this.#t)!==F(t.enabled,this.#t)||r!==this.#p)&&this.#v(r)}getOptimisticResult(e){let t=this.#e.getQueryCache().build(this.#e,e),i=this.createResult(t,e);return Ba(this.getCurrentResult(),i)||(this.#n=i,this.#r=this.options,this.#a=this.#t.state),i}getCurrentResult(){return this.#n}trackResult(e,t){return new Proxy(e,{get:(i,n)=>(this.trackProp(n),t?.(n),Reflect.get(i,n))})}trackProp(e){this.#g.add(e)}getCurrentQuery(){return this.#t}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){let t=this.#e.defaultQueryOptions(e),i=this.#e.getQueryCache().build(this.#e,t),n=()=>{},r,a=new Promise(o=>{r=o,n=this.#e.getQueryCache().subscribe(s=>{s.type==="updated"&&s.query.queryHash===i.queryHash&&i.state.data!==void 0&&(n(),o(this.createResult(i,t)))})});return Promise.race([i.fetch(t).then(()=>{let o=this.createResult(i,t);return r?.(o),o}).finally(()=>{n()}),a])}fetch(e){return this.#f({...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#n))}#f(e){this.#k();let t=this.#t.fetch(this.options,e);return e?.throwOnError||(t=t.catch(ee)),t}#m(e){return!Ki()&&F(this.options.enabled,this.#t)!==!1&&Ma(e)}#h(){this.#b();let e=F(this.options.staleTime,this.#t);if(this.#n.isStale||!this.#m(e))return;let t=Da(this.#n.dataUpdatedAt,e)+1;this.#u=tt.setTimeout(()=>{this.#n.isStale||this.updateResult()},t)}#x(){return F(this.options.refetchInterval,this.#t)??!1}#v(e){this.#w(),this.#p=e,!(this.#p===0||!this.#m(this.#p))&&(this.#c=tt.setInterval(()=>{(this.options.refetchIntervalInBackground||$i.isFocused())&&this.#f()},this.#p))}#y(){this.#h(),this.#v(this.#x())}#b(){this.#u!==void 0&&(tt.clearTimeout(this.#u),this.#u=void 0)}#w(){this.#c!==void 0&&(tt.clearInterval(this.#c),this.#c=void 0)}createResult(e,t){let i=this.#t,n=this.options,r=this.#n,a=this.#a,o=this.#r,s=e!==i?e.state:this.#i,{state:l}=e,d={...l},c=!1,g;if(t._optimisticResults){let k=this.hasListeners(),E=!k&&lf(e,t),N=k&&sf(e,i,t,n);(E||N)&&(d={...d,...Ls(l.data,e.options)}),t._optimisticResults==="isRestoring"&&(d.fetchStatus="idle")}let{error:h,errorUpdatedAt:v,status:b}=d;g=d.data;let m=!1;if(t.placeholderData!==void 0&&g===void 0&&b==="pending"){let k;r?.isPlaceholderData&&t.placeholderData===o?.placeholderData?(k=r.data,m=!0):k=typeof t.placeholderData=="function"?t.placeholderData(this.#l?.state.data,this.#l):t.placeholderData,k!==void 0&&(b="success",g=Jn(r?.data,k,t),c=!0)}if(t.select&&g!==void 0&&!m)if(r&&g===a?.data&&t.select===this.#s)g=this.#d;else try{this.#s=t.select,g=t.select(g),g=Jn(r?.data,g,t),this.#d=g,this.#o=null}catch(k){this.#o=k}else g===void 0&&(this.#o=null);this.#o&&(h=this.#o,g=this.#d,v=Date.now(),b="error",c=!1);let S=d.fetchStatus==="fetching",u=b==="pending",p=b==="error",f=u&&S,y=g!==void 0;return{status:b,fetchStatus:d.fetchStatus,isPending:u,isSuccess:b==="success",isError:p,isInitialLoading:f,isLoading:f,data:g,dataUpdatedAt:d.dataUpdatedAt,error:h,errorUpdatedAt:v,failureCount:d.fetchFailureCount,failureReason:d.fetchFailureReason,errorUpdateCount:d.errorUpdateCount,isFetched:e.isFetched(),isFetchedAfterMount:d.dataUpdateCount>s.dataUpdateCount||d.errorUpdateCount>s.errorUpdateCount,isFetching:S,isRefetching:S&&!u,isLoadingError:p&&!y,isPaused:d.fetchStatus==="paused",isPlaceholderData:c,isRefetchError:p&&y,isStale:js(e,t),refetch:this.refetch,isEnabled:F(t.enabled,e)!==!1}}updateResult(){let e=this.#n,t=this.createResult(this.#t,this.options);if(this.#a=this.#t.state,this.#r=this.options,this.#a.data!==void 0&&(this.#l=this.#t),Ba(t,e))return;this.#n=t;let n=(()=>{if(!e)return!0;let{notifyOnChangeProps:r}=this.options,a=typeof r=="function"?r():r;if(a==="all"||!a&&!this.#g.size||this.options.throwOnError&&this.#n.error!==e.error)return!0;for(let o of a??this.#g)if(this.#n[o]!==e[o])return!0;return!1})();G.batch(()=>{n&&this.listeners.forEach(r=>{r(this.#n)}),this.#e.getQueryCache().notify({query:this.#t,type:"observerResultsUpdated"})})}#k(){let e=this.#e.getQueryCache().build(this.#e,this.options);if(e===this.#t)return;let t=this.#t;this.#t=e,this.#i=e.state,this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#y()}};function Px(e,t){return F(t.enabled,e)!==!1&&e.state.data===void 0&&!(e.state.status==="error"&&F(t.retryOnMount,e)===!1)}function lf(e,t){return Px(e,t)||e.state.data!==void 0&&Ts(e,t,t.refetchOnMount)}function Ts(e,t,i){if(F(t.enabled,e)!==!1&&F(t.staleTime,e)!=="static"){let n=F(i,e);return n==="always"||n!==!1&&js(e,t)}return!1}function sf(e,t,i,n){return(e!==t||F(n.enabled,e)===!1)&&(!i.suspense||e.state.status!=="error")&&js(e,i)}function js(e,t){return F(t.enabled,e)!==!1&&e.isStaleByTime(F(t.staleTime,e))}var df=class extends qa{#e;#t;#i;#n;constructor(e){super(),this.#e=e.client,this.mutationId=e.mutationId,this.#i=e.mutationCache,this.#t=[],this.state=e.state||Lx(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){this.#t.includes(e)||(this.#t.push(e),this.clearGcTimeout(),this.#i.notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){this.#t=this.#t.filter(t=>t!==e),this.scheduleGc(),this.#i.notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){this.#t.length||(this.state.status==="pending"?this.scheduleGc():this.#i.remove(this))}continue(){return this.#n?.continue()??(this.state.status==="pending"?this.execute(this.state.variables):Promise.resolve())}async execute(e){let t=()=>{this.#a({type:"continue"})},i={client:this.#e,meta:this.options.meta,mutationKey:this.options.mutationKey},n=this.#n=Ga({fn:()=>this.options.mutationFn?this.options.mutationFn(e,i):Promise.reject(new Error("No mutationFn found")),onFail:(o,s)=>{this.#a({type:"failed",failureCount:o,error:s})},onPause:()=>{this.#a({type:"pause"})},onContinue:t,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>this.#i.canRun(this)}),r=this.state.status==="pending",a=!n.canStart();try{if(r)t();else{this.#a({type:"pending",variables:e,isPaused:a}),this.#i.config.onMutate&&await this.#i.config.onMutate(e,this,i);let s=await this.options.onMutate?.(e,i);s!==this.state.context&&this.#a({type:"pending",context:s,variables:e,isPaused:a})}this.state.isPaused&&n.canStart()&&t();let o=await n.start();return await this.#i.config.onSuccess?.(o,e,this.state.context,this,i),await this.options.onSuccess?.(o,e,this.state.context,i),await this.#i.config.onSettled?.(o,null,this.state.variables,this.state.context,this,i),await this.options.onSettled?.(o,null,e,this.state.context,i),this.#a({type:"success",data:o}),o}catch(o){try{await this.#i.config.onError?.(o,e,this.state.context,this,i)}catch(s){Promise.reject(s)}try{await this.options.onError?.(o,e,this.state.context,i)}catch(s){Promise.reject(s)}try{await this.#i.config.onSettled?.(void 0,o,this.state.variables,this.state.context,this,i)}catch(s){Promise.reject(s)}try{await this.options.onSettled?.(void 0,o,e,this.state.context,i)}catch(s){Promise.reject(s)}throw this.#a({type:"error",error:o}),o}finally{this.#n===n&&(this.#n=void 0),this.#i.runNext(this)}}#a(e){let t=i=>{switch(e.type){case"failed":return{...i,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...i,isPaused:!0};case"continue":return{...i,isPaused:!1};case"pending":return{...i,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...i,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...i,data:void 0,error:e.error,failureCount:i.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}};this.state=t(this.state),G.batch(()=>{this.#t.forEach(i=>{i.onMutationUpdate(e)}),this.#i.notify({mutation:this,type:"updated",action:e})})}};function Lx(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}var pf=class extends it{#e;#t;#i;constructor(e={}){super(),this.config=e,this.#e=new Set,this.#t=new Map,this.#i=0}build(e,t,i){let n=new df({client:e,mutationCache:this,mutationId:++this.#i,options:e.defaultMutationOptions(t),state:i});return this.add(n),n}add(e){this.#e.add(e);let t=Wa(e);if(typeof t=="string"){let i=this.#t.get(t);i?i.push(e):this.#t.set(t,[e])}this.notify({type:"added",mutation:e})}remove(e){if(this.#e.delete(e)){let t=Wa(e);if(typeof t=="string"){let i=this.#t.get(t);if(i)if(i.length>1){let n=i.indexOf(e);n!==-1&&i.splice(n,1)}else i[0]===e&&this.#t.delete(t)}}this.notify({type:"removed",mutation:e})}canRun(e){let t=Wa(e);if(typeof t=="string"){let i=this.#t.get(t)?.find(n=>n.state.status==="pending");return!i||i===e}else return!0}runNext(e){let t=Wa(e);return typeof t=="string"?this.#t.get(t)?.find(i=>i!==e&&i.state.isPaused)?.continue()??Promise.resolve():Promise.resolve()}clear(){G.batch(()=>{let e=this.getAll();this.#e.clear(),this.#t.clear(),e.forEach(t=>{this.notify({type:"removed",mutation:t})})})}getAll(){return Array.from(this.#e)}find(e){let t={exact:!0,...e};return this.getAll().find(i=>Ua(t,i))}findAll(e={}){return this.getAll().filter(t=>Ua(e,t))}notify(e){G.batch(()=>{this.listeners.forEach(t=>{t(e)})})}resumePausedMutations(){let e=this.getAll().filter(t=>t.state.isPaused);return G.batch(()=>Promise.all(e.map(t=>t.continue().catch(ee))))}};function Wa(e){return e.options.scope?.id}var uf=class extends it{#e;constructor(e={}){super(),this.config=e,this.#e=new Map}build(e,t,i){let n=t.queryKey,r=t.queryHash??Zn(n,t),a=this.get(r);return a||(a=new of({client:e,queryKey:n,queryHash:r,options:e.defaultQueryOptions(t),state:i,defaultOptions:e.getQueryDefaults(n)}),this.add(a)),a}add(e){this.#e.has(e.queryHash)||(this.#e.set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){this.#e.get(e.queryHash)===e&&(e.destroy(),this.#e.delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){G.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return this.#e.get(e)}getAll(){return[...this.#e.values()]}find(e){let t={exact:!0,...e};return this.getAll().find(i=>Fa(t,i))}findAll(e={}){let t=this.getAll();return Object.keys(e).length>0?t.filter(i=>Fa(e,i)):t}notify(e){G.batch(()=>{this.listeners.forEach(t=>{t(e)})})}onFocus(){G.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){G.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}};var As=class{#e;#t;#i;#n;#a;#r;#o;#s;constructor(e={}){this.#e=e.queryCache||new uf,this.#t=e.mutationCache||new pf,this.#i=e.defaultOptions||{},this.#n=new Map,this.#a=new Map,this.#r=0}mount(){this.#r++,this.#r===1&&(this.#o=$i.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#e.onFocus())}),this.#s=Yi.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#e.onOnline())}))}unmount(){this.#r--,this.#r===0&&(this.#o?.(),this.#o=void 0,this.#s?.(),this.#s=void 0)}isFetching(e){return this.#e.findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return this.#t.findAll({...e,status:"pending"}).length}getQueryData(e){let t=this.defaultQueryOptions({queryKey:e});return this.#e.get(t.queryHash)?.state.data}ensureQueryData(e){let t=this.defaultQueryOptions(e),i=this.#e.build(this,t),n=i.state.data;return n===void 0?this.fetchQuery(e):(e.revalidateIfStale&&i.isStaleByTime(F(t.staleTime,i))&&this.prefetchQuery(t),Promise.resolve(n))}getQueriesData(e){return this.#e.findAll(e).map(({queryKey:t,state:i})=>[t,i.data])}setQueryData(e,t,i){let n=this.defaultQueryOptions({queryKey:e}),r=this.#e.get(n.queryHash)?.state.data,a=Kc(t,r);if(a!==void 0)return this.#e.build(this,n).setData(a,{...i,manual:!0})}setQueriesData(e,t,i){return G.batch(()=>this.#e.findAll(e).map(({queryKey:n})=>[n,this.setQueryData(n,t,i)]))}getQueryState(e){let t=this.defaultQueryOptions({queryKey:e});return this.#e.get(t.queryHash)?.state}removeQueries(e){let t=this.#e;G.batch(()=>{t.findAll(e).forEach(i=>{t.remove(i)})})}resetQueries(e,t){let i=this.#e;return G.batch(()=>{let n=i.findAll(e),r=new Set(n);return n.forEach(a=>{a.reset()}),this.refetchQueries({type:"active",predicate:a=>r.has(a)},t)})}cancelQueries(e,t={}){let i={revert:!0,...t},n=G.batch(()=>this.#e.findAll(e).map(r=>r.cancel(i)));return Promise.all(n).then(ee).catch(ee)}invalidateQueries(e,t={}){return G.batch(()=>(this.#e.findAll(e).forEach(i=>{i.invalidate()}),e?.refetchType==="none"?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},t)))}refetchQueries(e,t={}){let i={...t,cancelRefetch:t.cancelRefetch??!0},n=G.batch(()=>this.#e.findAll(e).filter(r=>!r.isDisabled()&&!r.isStatic()).map(r=>{let a=r.fetch(void 0,i),o=r.state.fetchStatus==="paused";return(!i.throwOnError||o)&&(a=a.catch(ee)),o?Promise.resolve():a}));return Promise.all(n).then(ee)}async query(e){let t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);let i=this.#e.build(this,t),n=i.isStaleByTime(F(t.staleTime,i))?await i.fetch(t):i.state.data,r=t.select;return r?r(n):n}fetchQuery(e){let t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);let i=this.#e.build(this,t);return i.isStaleByTime(F(t.staleTime,i))?i.fetch(t):Promise.resolve(i.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(ee).catch(ee)}infiniteQuery(e){return e._type="infinite",this.query(e)}fetchInfiniteQuery(e){return e._type="infinite",this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(ee).catch(ee)}ensureInfiniteQueryData(e){return e._type="infinite",this.ensureQueryData(e)}resumePausedMutations(){return Yi.isOnline()?this.#t.resumePausedMutations():Promise.resolve()}getQueryCache(){return this.#e}getMutationCache(){return this.#t}getDefaultOptions(){return this.#i}setDefaultOptions(e){this.#i=e}setQueryDefaults(e,t){this.#n.set(ui(e),{queryKey:e,defaultOptions:t})}getQueryDefaults(e){let t=[...this.#n.values()],i={};return t.forEach(n=>{Vt(e,n.queryKey)&&Object.assign(i,n.defaultOptions)}),i}setMutationDefaults(e,t){this.#a.set(ui(e),{mutationKey:e,defaultOptions:t})}getMutationDefaults(e){let t=[...this.#a.values()],i={};return t.forEach(n=>{Vt(e,n.mutationKey)&&Object.assign(i,n.defaultOptions)}),i}defaultQueryOptions(e){if(e._defaulted)return e;let t={...this.#i.queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return t.queryHash||(t.queryHash=Zn(t.queryKey,t)),t.refetchOnReconnect===void 0&&(t.refetchOnReconnect=t.networkMode!=="always"),t.throwOnError===void 0&&(t.throwOnError=!!t.suspense),!t.networkMode&&t.persister&&(t.networkMode="offlineFirst"),t.queryFn===Wi&&(t.enabled=!1),t}defaultMutationOptions(e){return e?._defaulted?e:{...this.#i.mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){this.#e.clear(),this.#t.clear()}};var Ka=I(V(),1),cf=Ka.createContext(!1),ff=()=>Ka.useContext(cf),P0=cf.Provider;var tr=I(V(),1),Tx=I(L(),1);function Ox(){let e=!1;return{clearReset:()=>{e=!1},reset:()=>{e=!0},isReset:()=>e}}var jx=tr.createContext(Ox()),gf=()=>tr.useContext(jx);var mf=I(V(),1);var hf=(e,t,i)=>{let n=i?.state.status==="error"&&typeof e.throwOnError=="function"?Ha(e.throwOnError,[i.state.error,i]):e.throwOnError;(e.suspense||n)&&(t.isReset()||(e.retryOnMount=!1))},xf=e=>{mf.useEffect(()=>{e.clearReset()},[e])},vf=({result:e,errorResetBoundary:t,throwOnError:i,query:n,suspense:r})=>e.isError&&!t.isReset()&&!e.isFetching&&n&&(r&&e.data===void 0||Ha(i,[e.error,n]));var yf=e=>{if(e.suspense){let i=r=>r==="static"?r:Math.max(r??1e3,1e3),n=e.staleTime;e.staleTime=typeof n=="function"?(...r)=>i(n(...r)):i(n),typeof e.gcTime=="number"&&(e.gcTime=Math.max(e.gcTime,1e3))}},bf=(e,t)=>e?.suspense&&t.isPending,wf=(e,t,i)=>t.fetchOptimistic(e).catch(()=>{i.clearReset()});var Ht=I(V(),1);function kf(e,t,i){let n=ff(),r=gf(),a=Qc(i),o=a.defaultQueryOptions(e),s=a.getQueryCache().get(o.queryHash),l=e.subscribed!==!1;o._optimisticResults=n?"isRestoring":l?"optimistic":void 0,yf(o),hf(o,r,s),xf(r);let[d]=Ht.useState(()=>new t(a,o)),c=d.getOptimisticResult(o);Ht.useEffect(()=>{d.setOptions(o)},[o,d]);let g=!n&&l;if(Ht.useSyncExternalStore(Ht.useCallback(h=>{let v=g?d.subscribe(G.batchCalls(h)):ee;return d.updateResult(),v},[d,g]),()=>d.getCurrentResult(),()=>d.getCurrentResult()),bf(o,c))throw wf(o,d,r);if(vf({result:c,errorResetBoundary:r,throwOnError:o.throwOnError,query:s,suspense:o.suspense}))throw c.error;return o.notifyOnChangeProps?c:d.trackResult(c)}function Ms(e,t){return kf(e,Os,t)}var ir=new As({defaultOptions:{queries:{staleTime:1e3,gcTime:300*1e3,retry:!1,refetchOnWindowFocus:!1}}});var Ds=class extends Error{constructor(i,n,r){super(n);this.code=i;this.status=r;this.name="ApiError"}code;status};async function Fs(e,t,i,n){let r=t instanceof FormData,a=await fetch("/api/iad"+e,{method:i||(t===void 0?"GET":"POST"),headers:t===void 0||r?void 0:{"Content-Type":"application/json"},body:t===void 0?void 0:r?t:JSON.stringify(t),signal:n}),o=await a.json();if(!a.ok)throw new Ds(o.error?.code,o.error?.message||`\u8BF7\u6C42\u5931\u8D25 (${a.status})`,a.status);return!["GET","HEAD"].includes((i||(t===void 0?"GET":"POST")).toUpperCase())&&e!=="/datasets/preview"&&ir.invalidateQueries({queryKey:["iad"]},{cancelRefetch:!1}),o}var Sf={raw_label_filters:[],annotation_filters:[],model_status:"all",review_status:"all",technical:"all",reference_status:"all",search:"",sort_by:"default"},Ax={...Sf,review_status:"pending"};var If=(e,t="image")=>`/api/iad/media/sample/${encodeURIComponent(e.task_id)}/${encodeURIComponent(e.sample_id)}/${t}${t==="thumbnail"?"?size=240":""}`,$a=e=>e instanceof Error?e.message:String(e);var Xi=(e,t)=>`/api/iad/evidence/${encodeURIComponent(e)}/${encodeURIComponent(t.evidence_id)}`;var Us={annotation:"Labelme \u7EBF\u7D22",model:"MLLM \u5019\u9009",coverage:"\u7EC6\u8282\u8986\u76D6"},Ya=e=>new Map([e.overview,...e.regions.map(t=>t.image),...e.auxiliary_evidence,...e.reference_evidence].map(t=>[t.evidence_id,t]));var ze=I(L(),1);function nr({source:e,viewport:t,fit:i="stretch"}){let n=(0,Qt.useId)(),[r,a]=e.kind==="sample"?[e.sample.width,e.sample.height]:e.kind==="boxes"?[e.width,e.height]:e.analysis.overview.original_size,o=e.kind!=="audit"?e.annotations.filter(m=>m.geometry_status!=="INVALID"):[],s=e.kind==="sample"?e.annotations.filter(m=>m.geometry_status!=="INVALID"&&m.annotation_type==="mask").map(m=>({id:m.annotation_id,bbox:[0,0,r,a],url:e.maskUrls?.[m.annotation_id]||`${If(e.sample,"mask")}?${new URLSearchParams({annotation_id:m.annotation_id,sha256:m.mask_sha256||""})}`})):e.kind==="audit"?e.analysis.auxiliary_evidence.filter(m=>m.representation==="annotation_mask").map(m=>({id:m.evidence_id,bbox:m.crop_bbox,url:Xi(e.suggestionId,m)})):[],[l,d,c,g]=t||[0,0,r,a],h=(0,Qt.useRef)(null),[v,b]=(0,Qt.useState)(12);return(0,Qt.useLayoutEffect)(()=>{let m=h.current,S=()=>{let p=Math.abs(m.getScreenCTM()?.a||0);p&&b(12/p)},u=new ResizeObserver(S);return u.observe(m),S(),()=>u.disconnect()},[l,d,c,g,i]),(0,ze.jsxs)("svg",{ref:h,className:"iad-annotation-layer",viewBox:`${l} ${d} ${c-l} ${g-d}`,preserveAspectRatio:i==="contain"?"xMidYMid meet":"none","aria-label":"Labelme \u6807\u6CE8",children:[!!s.length&&(0,ze.jsx)("g",{className:"iad-annotation-mask",children:s.map((m,S)=>{let u=`${n}-mask-${S}`,[p,f,y,k]=m.bbox;return(0,ze.jsxs)("g",{children:[(0,ze.jsx)("defs",{children:(0,ze.jsx)("mask",{id:u,x:0,y:0,width:r,height:a,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse",style:{maskType:"luminance"},children:(0,ze.jsx)(Hc,{href:m.url,x:p,y:f,width:y-p,height:k-f,preserveAspectRatio:"none",style:{imageRendering:"pixelated"}})})}),(0,ze.jsx)("rect",{x:0,y:0,width:r,height:a,mask:`url(#${u})`})]},m.id)})}),o.map((m,S)=>(0,ze.jsxs)("g",{children:[m.annotation_type!=="mask"&&(m.polygon?(0,ze.jsx)("polygon",{points:m.polygon.map(u=>u.join(",")).join(" ")}):m.bbox&&(0,ze.jsx)("rect",{x:m.bbox[0],y:m.bbox[1],width:m.bbox[2]-m.bbox[0],height:m.bbox[3]-m.bbox[1]})),m.bbox&&(0,ze.jsx)("text",{style:{fontSize:v},x:m.bbox[0],y:Math.max(v,m.bbox[1]-4),children:m.raw_label})]},m.annotation_id||S))]})}var Ef=I(L(),1);function rr({label:e}){return e?(0,Ef.jsx)("span",{className:"iad-image-quality","data-quality":e,children:e}):null}var Zi=I(L(),1);function Cf({src:e,alt:t="",width:i,height:n,bboxes:r=[],annotationLayer:a,qualityLabel:o,showAnnotations:s=!0,className:l="",style:d,children:c,onLoadDimensions:g}){let[h,v]=(0,_f.useState)({width:i||0,height:n||0}),b=h.width||i||800,m=h.height||n||600;return(0,Zi.jsxs)("div",{className:`annotated-image-stage ${l}`,style:{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",...d},children:[(0,Zi.jsx)("img",{"data-media-label":"\u56FE\u50CF",src:e,alt:t,draggable:!1,style:{maxWidth:"100%",maxHeight:"100%",width:"100%",height:"100%",objectFit:"contain",display:"block",pointerEvents:"none",userSelect:"none"},onLoad:S=>{let u=S.currentTarget;u.naturalWidth&&u.naturalHeight&&(v({width:u.naturalWidth,height:u.naturalHeight}),g?.({naturalWidth:u.naturalWidth,naturalHeight:u.naturalHeight}))}}),s&&(a||r.length>0)&&(0,Zi.jsx)(nr,{fit:"contain",source:a||{kind:"boxes",annotations:r,width:b,height:m}}),c,(0,Zi.jsx)(rr,{label:o})]})}var Gt=I(L(),1),Xa=(0,Nf.forwardRef)(function({src:t,image:i,variant:n="thumbnail",label:r,children:a,mediaOverlay:o,className:s="",title:l=r,...d},c){return(0,Gt.jsxs)("button",{...d,"data-variant":n,ref:c,type:"button",className:`iad-thumbnail-card ${s}`,title:l,children:[(0,Gt.jsxs)("span",{className:"iad-thumbnail-media",children:[i?(0,Gt.jsx)(Cf,{src:i.src,alt:i.title,width:i.width,height:i.height,annotationLayer:i.annotationLayer,qualityLabel:i.qualityLabel}):t?(0,Gt.jsx)(qi,{src:t,alt:r,loading:"lazy",decoding:"async"}):(0,Gt.jsx)("span",{children:"\u56FE\u50CF\u4E0D\u53EF\u7528"}),o]}),r&&(0,Gt.jsx)("span",{className:"iad-thumbnail-caption",children:r}),a]})});var qt=I(L(),1),Mx=24;function zf({total:e,page:t,unit:i="\u6761",onPage:n,size:r=Mx,label:a="",id:o,availablePages:s,hideSinglePage:l=!1}){if(!e||l&&e<=r)return null;let d=Math.max(1,Math.ceil(e/r)),c=Math.max(1,Math.min(t,d)),g=Math.max(1,Math.min(c-2,d-4));return(0,qt.jsxs)("nav",{id:o,className:"iad-pagination","aria-label":`${a}\u5206\u9875`,children:[(0,qt.jsx)("button",{type:"button",disabled:c<=1,onClick:()=>n(c-1),children:"\u4E0A\u4E00\u9875"}),Array.from({length:Math.min(d,5)},(h,v)=>g+v).map(h=>(0,qt.jsx)("button",{type:"button","aria-label":`\u7B2C ${h} \u9875`,"aria-current":h===c?"page":void 0,"data-page":h,disabled:s!==void 0&&h>s,onClick:()=>n(h),children:h},h)),(0,qt.jsx)("button",{type:"button",disabled:c>=d||s!==void 0&&c>=s,onClick:()=>n(c+1),children:"\u4E0B\u4E00\u9875"}),(0,qt.jsxs)("span",{children:[c," / ",d," \u9875"]}),(0,qt.jsxs)("span",{children:["\u5171 ",e," ",i]})]})}function Rf(e,t,i){return e==="folder_classification"?{annotationLayer:null,qualityLabel:t.quality_status==="PASS"?"OK":t.quality_status==="FAIL"?"NG":void 0}:e!=="labelme"?{}:{annotationLayer:{kind:"boxes",width:t.width,height:t.height,annotations:i.filter(n=>n.geometry_status!=="INVALID"&&(n.bbox||n.polygon))}}}var fi=I(V(),1);var Ji=I(V(),1);var R=I(L(),1);function Pf(){return(0,R.jsx)("svg",{"aria-hidden":"true",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",children:(0,R.jsx)("path",{d:"m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5"})})}function Lf({size:e=16}={}){return(0,R.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,R.jsx)("path",{d:"M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"})})}function Tf(){return(0,R.jsxs)("svg",{"aria-hidden":"true",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinejoin:"round",children:[(0,R.jsx)("rect",{x:"8",y:"8",width:"12",height:"13",rx:"2"}),(0,R.jsx)("path",{d:"M16 8V3H3v13h5"})]})}function Of(){return(0,R.jsx)("svg",{"aria-hidden":"true",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,R.jsx)("path",{d:"M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"})})}function jf(){return(0,R.jsx)("svg",{"aria-hidden":"true",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:(0,R.jsx)("path",{d:"m6 6 12 12M18 6 6 18"})})}function Af(){return(0,R.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,R.jsx)("path",{d:"M4 5h16l-6.5 7.5v4.3l-3.5 2v-6.3L4 5Z"}),(0,R.jsx)("path",{d:"m17 17 4 4m0-4-4 4"})]})}function Mf(){return(0,R.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:[(0,R.jsx)("circle",{cx:"10",cy:"10",r:"7"}),(0,R.jsx)("path",{d:"m15 15 6 6M7 10h6M10 7v6"})]})}function Df(){return(0,R.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:[(0,R.jsx)("circle",{cx:"10",cy:"10",r:"7"}),(0,R.jsx)("path",{d:"m15 15 6 6M7 10h6"})]})}function Ff(){return(0,R.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,R.jsx)("circle",{cx:"12",cy:"12",r:"2.8"}),(0,R.jsx)("path",{d:"M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"})]})}function Uf(){return(0,R.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,R.jsx)("path",{d:"M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"})})}function Bf(){return(0,R.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,R.jsx)("path",{d:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"}),(0,R.jsx)("circle",{cx:"12",cy:"12",r:"3"}),(0,R.jsx)("path",{d:"m3 3 18 18"})]})}function Bs({size:e=16}){return(0,R.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:(0,R.jsx)("path",{d:"m6 9 6 6 6-6"})})}function Vf({size:e=16}){return(0,R.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:(0,R.jsx)("path",{d:"M12 5v14M5 12h14"})})}function Hf({size:e=18}){return(0,R.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,R.jsx)("path",{d:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"}),(0,R.jsx)("circle",{cx:"12",cy:"12",r:"3"})]})}function Qf(){return(0,R.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,R.jsx)("path",{d:"M12 8v4l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"})})}function Gf({size:e=17}){return(0,R.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,R.jsx)("path",{d:"M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10l-7-7Z"}),(0,R.jsx)("path",{d:"M13 3v7h7"}),(0,R.jsx)("circle",{cx:"11",cy:"15",r:"2.3"}),(0,R.jsx)("path",{d:"m12.8 16.8 2.3 2.3"})]})}function qf({size:e=18}){return(0,R.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,R.jsx)("path",{d:"M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"}),(0,R.jsx)("path",{d:"M14 3v5h5M9 12h6M9 16h6"})]})}function Wf({size:e=20}){return(0,R.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,R.jsx)("path",{d:"M12 6c-2.4-2-5.5-2.4-9-2v15c3.5-.5 6.5.2 9 2 2.5-1.8 5.5-2.5 9-2V4c-3.5-.4-6.6 0-9 2Z"}),(0,R.jsx)("path",{d:"M12 6v15"})]})}function Kf({size:e=17}){return(0,R.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,R.jsx)("path",{d:"M18 20V10M12 20V4M6 20v-6"})})}var Vs=I(L(),1),ar=(0,Ji.forwardRef)(function({className:t="",...i},n){return(0,Vs.jsx)("select",{...i,ref:n,className:`iad-select ${t}`})});var $f=I(V(),1);var Hs=I(L(),1),Dx={close:jf,delete:Of,refresh:Lf,clear:Af,edit:Pf,copy:Tf,add:Vf,chevron:Bs,prompt:qf,details:Gf,clock:Qf,mine:Wf,stats:Kf,annotations:Hf,annotationsOff:Bf,zoomIn:Mf,zoomOut:Df,fit:Ff,expand:Uf},vt=(0,$f.forwardRef)(function({icon:t,label:i,title:n=i,type:r="button",className:a="",...o},s){let l=Dx[t];return(0,Hs.jsx)("button",{...o,ref:s,type:r,"aria-label":i,title:n,"data-icon":t,className:`iad-icon-button ${a}`.trim(),children:(0,Hs.jsx)(l,{})})});var M=I(V(),1),Zf=I(Ss(),1);var nt=I(V(),1),en=I(L(),1);function Yf({id:e,title:t,onClose:i,children:n,className:r="",size:a="detail",frame:o="dialog",restoreFocus:s,initialFocus:l,header:d=!0,presentation:c="modal",onKeyDown:g}){let h=(0,nt.useRef)(null),v=(0,nt.useRef)(s),b=(0,nt.useRef)(!1),m=(0,nt.useRef)(null),S=(0,nt.useRef)(c);v.current=s,(0,nt.useLayoutEffect)(()=>{let p=h.current,f=document.activeElement,y=p.matches(":modal");if(m.current||(m.current=f),S.current=c,p.open&&p.close(),c==="inline"&&p.show(),c==="modal"&&(p.showModal(),l?.current?l.current.focus():f instanceof HTMLElement&&p.contains(f)&&f.focus()),c==="closed"&&(y||f&&p.contains(f))){let k=v.current?v.current():m.current;k instanceof HTMLElement&&k.isConnected&&k.focus()}},[c,l]),(0,nt.useEffect)(()=>{let p=h.current;return()=>{if(p.close(),S.current!=="modal")return;let f=v.current?v.current():m.current;f instanceof HTMLElement&&f.isConnected&&f.focus()}},[]);let u=p=>{let f=p.currentTarget.getBoundingClientRect();return p.target===p.currentTarget&&(p.clientX<f.left||p.clientX>f.right||p.clientY<f.top||p.clientY>f.bottom)};return(0,en.jsxs)("dialog",{id:e,ref:h,onClick:p=>{c==="modal"&&p.stopPropagation()},onKeyDown:p=>{c==="modal"&&p.stopPropagation(),g?.(p)},"aria-label":t,role:c==="inline"?"region":void 0,className:`${o==="fullscreen"?"iad-fullscreen-dialog":"iad-detail-dialog"} ${a!=="detail"?`iad-dialog-${a}`:""} ${c==="inline"?"iad-inline-dialog":""} ${r}`,onCancel:p=>{p.preventDefault(),p.stopPropagation(),i()},onPointerDown:p=>{b.current=u(p)},onPointerUp:p=>{b.current&&u(p)&&i(),b.current=!1},children:[d&&c==="modal"&&(0,en.jsxs)("header",{className:"iad-dialog-header",children:[(0,en.jsx)("h2",{children:t}),(0,en.jsx)(vt,{icon:"close",type:"button",label:`\u5173\u95ED${t}`,title:"\u5173\u95ED",onClick:i})]}),n]})}var Za=I(V(),1);var Ey=new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});function Xf(e,t=0,i=!1){let n=Ms({queryKey:["iad","resource",e],enabled:!!e,queryFn:({signal:a})=>Fs(e,void 0,void 0,a),refetchInterval:i?1200:!1,refetchOnWindowFocus:i},ir),r=(0,Za.useRef)({path:e,revision:t});return(0,Za.useEffect)(()=>{r.current.path===e&&r.current.revision!==t&&e&&ir.invalidateQueries({queryKey:["iad","resource",e],exact:!0},{cancelRefetch:!1}),r.current={path:e,revision:t}},[e,t]),{data:e?n.data??null:null,error:e&&n.error?$a(n.error):"",loading:!!e&&n.isPending,refreshing:!!e&&n.isFetching}}var j=I(L(),1);function Jf({open:e,item:t,items:i=[],currentIndex:n=-1,onClose:r,onNavigate:a,navigation:o,context:s,overlay:l,initialTransform:d,onTransform:c,onImageClick:g}){let h=Xf(e&&t?.sampleId&&t.annotationLayer===void 0&&!t.qualityLabel?`/sample/${encodeURIComponent(t.sampleId)}`:null),v=t?.annotationLayer===null?void 0:t?.annotationLayer||(h.data?{kind:"sample",sample:h.data.sample,annotations:h.data.annotations}:t?.bboxes?.length?{kind:"boxes",annotations:t.bboxes,width:t.width||1,height:t.height||1}:void 0),[b,m]=(0,M.useState)("fit"),[S,u]=(0,M.useState)(1),[p,f]=(0,M.useState)(0),[y,k]=(0,M.useState)(0),[E,N]=(0,M.useState)(!0),[P,Z]=(0,M.useState)({width:0,height:0}),[T,Me]=(0,M.useState)({width:0,height:0}),[eo,Ks]=(0,M.useState)(!1),ot=(0,M.useRef)(null),ur=(0,M.useRef)(null),Fg=(0,M.useRef)(null),Ug=(0,M.useRef)(null),to=(0,M.useRef)(!1),nn=P.width||t?.width||800,rn=P.height||t?.height||600,yt=(0,M.useMemo)(()=>{if(T.width<=0||T.height<=0||nn<=0||rn<=0)return 1;let z=Math.max(100,T.width-128),W=Math.max(100,T.height-40),We=z/nn,mi=W/rn;return Math.max(.05,Math.min(We,mi))},[T.width,T.height,nn,rn]),$t=b==="fit"?yt:S*yt;(0,M.useEffect)(()=>{c?.({zoom:b==="fit"?0:S,x:p,y})},[b,S,p,y,c]),(0,M.useLayoutEffect)(()=>{Z({width:0,height:0})},[t?.imageUrl]);let io=(0,M.useCallback)(z=>{m("custom"),u(Math.max(.1,Math.min(10,z))/yt)},[yt]),$s=(0,M.useCallback)(()=>{m("fit"),f(0),k(0)},[]);(0,M.useLayoutEffect)(()=>{let z=ur.current;if(!z||!e)return;let W=new ResizeObserver(([We])=>{Me({width:We.contentRect.width,height:We.contentRect.height})});return W.observe(z),Me({width:z.clientWidth,height:z.clientHeight}),()=>W.disconnect()},[e]);let Bg=(0,M.useCallback)(z=>{z.target.closest("button")||z.target.closest("select")||(ot.current={x:z.clientX,y:z.clientY,panX:p,panY:y},to.current=!1,Ks(!0),z.currentTarget.setPointerCapture(z.pointerId))},[p,y]),Vg=(0,M.useCallback)(z=>{ot.current&&(Math.abs(z.clientX-ot.current.x)+Math.abs(z.clientY-ot.current.y)>4&&(to.current=!0),f(ot.current.panX+z.clientX-ot.current.x),k(ot.current.panY+z.clientY-ot.current.y))},[]),Ys=(0,M.useCallback)(()=>{ot.current=null,Ks(!1)},[]);(0,M.useEffect)(()=>{let z=ur.current;if(!z||!e)return;function W(We){We.preventDefault(),m("custom"),u(mi=>{let no=b==="fit"?yt:mi*yt;return Math.max(.1,Math.min(10,no*(We.deltaY<0?1.15:1/1.15)))/yt})}return z.addEventListener("wheel",W,{passive:!1}),()=>z.removeEventListener("wheel",W)},[e,b,yt]);let cr=(0,M.useCallback)(z=>{if(ur.current?.focus({preventScroll:!0}),o){!o.busy&&(z<0?o.previous:o.next)&&o.move(z<0?-1:1);return}if(n<0||!i.length||!a)return;let W=Math.max(0,Math.min(i.length-1,n+z));a(W),f(0),k(0),m("fit")},[n,i.length,a,o]);if((0,M.useEffect)(()=>{e&&t&&(f(d?.x||0),k(d?.y||0),m(d?.zoom?"custom":"fit"),d?.zoom&&u(d.zoom),N(!0))},[e,t?.id]),!e||!t)return null;let Hg=!!(v&&(v.kind!=="audit"?v.annotations.length:v.analysis.auxiliary_evidence.length)),Xs=t.title.split("/").pop()||t.title,Qg=(0,j.jsx)("div",{id:"full-overlay",className:"full-overlay",role:"presentation",children:(0,j.jsxs)("section",{className:"full-dialog",children:[(0,j.jsxs)("header",{className:"full-toolbar",role:"toolbar","aria-label":"\u56FE\u50CF\u67E5\u770B\u5DE5\u5177",children:[(0,j.jsx)("div",{className:"full-file",id:"full-file-name",title:t.title,style:{color:"#f4f7fd"},children:Xs}),(0,j.jsx)(rr,{label:t.qualityLabel}),(0,j.jsxs)("div",{className:"full-actions",children:[(0,j.jsx)(vt,{icon:"zoomOut",type:"button",id:"zoom-out",title:"\u7F29\u5C0F",label:"\u7F29\u5C0F",onClick:()=>io($t/1.25)}),(0,j.jsxs)("span",{className:"zoom-wrap",style:{background:"rgba(255, 255, 255, 0.12)",border:"1px solid rgba(255, 255, 255, 0.22)"},children:[(0,j.jsxs)(ar,{id:"zoom",title:"\u7F29\u653E\u6BD4\u4F8B","aria-label":"\u7F29\u653E\u6BD4\u4F8B",style:{color:"#f4f7fd",background:"transparent"},value:b==="fit"?"fit":[.5,1,1.5,2].some(z=>Math.abs($t-z)<.001)?String($t):"custom",onChange:z=>{let W=z.target.value;W==="fit"?$s():W!=="custom"&&io(Number(W))},children:[(0,j.jsx)("option",{value:"fit",children:"\u9002\u5E94\u7A97\u53E3"}),(0,j.jsx)("option",{value:"0.5",children:"50%"}),(0,j.jsx)("option",{value:"1",children:"100%"}),(0,j.jsx)("option",{value:"1.5",children:"150%"}),(0,j.jsx)("option",{value:"2",children:"200%"}),(0,j.jsx)("option",{value:"custom",children:b==="fit"||[.5,1,1.5,2].some(z=>Math.abs($t-z)<.001)?"\u81EA\u5B9A\u4E49":`${Math.round($t*100)}%`})]}),(0,j.jsx)("span",{className:"zoom-chevron","aria-hidden":"true",children:(0,j.jsx)("svg",{viewBox:"0 0 24 24",children:(0,j.jsx)("path",{d:"m6 9 6 6 6-6"})})})]}),(0,j.jsx)(vt,{icon:"zoomIn",type:"button",id:"zoom-in",title:"\u653E\u5927",label:"\u653E\u5927",onClick:()=>io($t*1.25)}),(0,j.jsx)(vt,{icon:"fit",type:"button",id:"fit",title:"\u9002\u5E94\u7A97\u53E3",label:"\u9002\u5E94\u7A97\u53E3",onClick:$s}),(0,j.jsx)(vt,{icon:E?"annotations":"annotationsOff",type:"button",id:"annotation-toggle",title:E?"\u9690\u85CF\u6807\u6CE8":"\u67E5\u770B\u6807\u6CE8",label:E?"\u9690\u85CF\u6807\u6CE8":"\u67E5\u770B\u6807\u6CE8","aria-pressed":E,disabled:!Hg,onClick:()=>N(z=>!z)}),(0,j.jsx)(vt,{icon:"close",type:"button",className:"full-close",id:"full-close",title:"\u5173\u95ED",label:"\u5173\u95ED",onClick:r})]})]}),(0,j.jsxs)("div",{className:"full-content",children:[(0,j.jsxs)("div",{className:`full-stage ${eo?"dragging":""}`,id:"stage",tabIndex:0,ref:ur,"aria-label":"\u5927\u56FE\u67E5\u770B\u533A\u57DF",onPointerDown:Bg,onPointerMove:Vg,onPointerUp:Ys,onPointerCancel:Ys,children:[(0,j.jsxs)("div",{id:"image-world",ref:Ug,className:"full-image-world",onClick:z=>{if(!g||to.current)return;let W=z.currentTarget.getBoundingClientRect(),[We,mi,no,Gg]=t.evidence?.crop_bbox||(v?.kind==="sample"?[0,0,v.sample.width,v.sample.height]:[0,0,t.width||nn,t.height||rn]);g([We+(z.clientX-W.left)/W.width*(no-We),mi+(z.clientY-W.top)/W.height*(Gg-mi)])},style:{position:"absolute",left:"50%",top:"50%",width:`${nn}px`,height:`${rn}px`,transformOrigin:"center",transform:`translate(-50%, -50%) translate(${p}px, ${y}px) scale(${$t})`},children:[(0,j.jsx)("img",{id:"big-image",ref:Fg,src:t.imageUrl,alt:Xs,draggable:!1,style:{width:"100%",height:"100%",display:"block",objectFit:"contain",pointerEvents:"none",userSelect:"none"},onLoad:z=>{let W=z.currentTarget;W.naturalWidth&&W.naturalHeight&&Z({width:W.naturalWidth,height:W.naturalHeight})}}),E&&v&&(0,j.jsx)(nr,{source:v,viewport:t.evidence?.crop_bbox}),l]}),(o||i.length>1&&a)&&(0,j.jsxs)(j.Fragment,{children:[(0,j.jsx)("button",{type:"button",className:"full-side-nav prev",id:"prev-img","aria-label":"\u4E0A\u4E00\u5F20\u56FE\u50CF",title:"\u4E0A\u4E00\u5F20\u56FE\u50CF",disabled:o?!o.previous||o.busy:n<=0,onClick:z=>{z.stopPropagation(),cr(-1)},children:"\u2039"}),(0,j.jsx)("button",{type:"button",className:"full-side-nav next",id:"next-img","aria-label":"\u4E0B\u4E00\u5F20\u56FE\u50CF",title:"\u4E0B\u4E00\u5F20\u56FE\u50CF",disabled:o?!o.next||o.busy:n>=i.length-1,onClick:z=>{z.stopPropagation(),cr(1)},children:"\u203A"})]})]}),s&&(0,j.jsx)("aside",{className:"full-context",children:s})]})]})}),Zs=(0,j.jsx)(Yf,{title:"\u539F\u56FE\u68C0\u89C6\u5668",frame:"fullscreen",header:!1,onClose:r,onKeyDown:z=>{if(z.key==="Escape"){z.preventDefault(),r();return}z.target.closest("input,textarea,select")||(z.key==="PageUp"||z.key==="ArrowLeft"?(z.preventDefault(),cr(-1)):(z.key==="PageDown"||z.key==="ArrowRight")&&(z.preventDefault(),cr(1)))},children:Qg});return typeof document>"u"?Zs:(0,Zf.createPortal)(Zs,document.body)}var Ja=I(L(),1);function Qs({analysis:e,ids:t,label:i,onEvidence:n,selectedId:r}){let a=Ya(e);return(0,Ja.jsx)("div",{className:"iad-actions",children:t.map((o,s)=>{let l=a.get(o);return(0,Ja.jsxs)("button",{"data-evidence-id":o,"aria-current":o===r?"true":void 0,disabled:!l,onClick:()=>l&&n(l),"aria-label":`\u67E5\u770B${i}\u7684\u8BC1\u636E ${s+1}`,children:["\u8BC1\u636E ",s+1,"\uFF0C",l?l.representation==="annotation_mask"?"\u5B9A\u4F4D\u56FE":l.role==="overview"?"\u5168\u56FE":"ROI":"\u4E0D\u53EF\u7528"]},o)})})}var Ux=I(V(),1);var Wt=I(L(),1);function eg({finding:e}){return(0,Wt.jsxs)(Wt.Fragment,{children:[(0,Wt.jsxs)("p",{children:["\u5F02\u5E38\u5047\u8BBE\uFF1A",e.hypothesis]}),(0,Wt.jsxs)("p",{children:["\u6B63\u5E38\u89E3\u91CA\uFF1A",e.normal_explanation]}),!!e.limitations.length&&(0,Wt.jsx)("p",{className:"iad-muted",children:e.limitations.join("\uFF1B")})]})}var tg=I(V(),1),ng=I(L(),1),ig=(0,tg.forwardRef)(function({variant:t="secondary",type:i="button",className:n="",...r},a){return(0,ng.jsx)("button",{...r,ref:a,type:i,"data-variant":t,className:["iad-button",n].filter(Boolean).join(" ")})});var lr=I(V(),1);var tn=I(V(),1);function ci(e,t){let i=t?.kind==="finding"?t.id:t?.findingId,n=e?.findings.find(o=>o.finding_id===i),r=e&&t?.kind==="evidence"?Ya(e).get(t.id):void 0,a=e?.regions.find(o=>t?.kind==="evidence"?o.image.evidence_id===t.id:n?.location.scope==="local"&&n.evidence_ids.includes(o.image.evidence_id));return{finding:n,evidence:r,region:a}}var Bx={"industrial-datasets":{label:"\u6570\u636E\u96C6\u7BA1\u7406",chapter:"\u6570\u636E\u51C6\u5907"},"industrial-images":{label:"\u56FE\u50CF\u6D4F\u89C8",chapter:"\u6570\u636E\u51C6\u5907"},"industrial-exploration":{label:"\u65B9\u5411\u63A2\u7D22",chapter:"\u77E5\u8BC6\u6784\u5EFA"},"industrial-knowledge":{label:"\u77E5\u8BC6\u6316\u6398",chapter:"\u77E5\u8BC6\u6784\u5EFA"},"industrial-consistency":{label:"\u6570\u636E\u4E00\u81F4\u6027",chapter:"\u8D28\u91CF\u5BA1\u6838"},"industrial-audit":{label:"\u6A21\u578B\u5BA1\u8BA1",chapter:"\u8D28\u91CF\u5BA1\u6838"},"industrial-review":{label:"\u4EBA\u5DE5\u590D\u6838",chapter:"\u8D28\u91CF\u5BA1\u6838"},"industrial-model-settings":{label:"\u6A21\u578B\u8BBE\u7F6E",chapter:"\u5DE5\u5177"}},rg=Object.fromEntries(Object.entries(Bx).map(([e,t])=>[e,t.label]));var Vx=(0,tn.createContext)(null);function or(){let e=(0,tn.useContext)(Vx);if(!e)throw new Error("Workbench requires its workspace owner");let t=(0,tn.useSyncExternalStore)(e.subscribe,e.getSnapshot);return{workspace:e,state:t}}var qe=I(L(),1);function ag({inspection:e,selection:t,transform:i}){let{workspace:n}=or(),[r,a]=(0,lr.useState)(!1),[o,s]=(0,lr.useState)(""),[l,d]=(0,lr.useState)(!1),[c,g]=(0,lr.useState)("");async function h(v){v.preventDefault(),d(!0),g("");let{finding:b,evidence:m}=ci(e.analysis,t);try{await n.ask({...e.reference,finding_id:b?.finding_id||null,evidence_id:m?.evidence_id||null},t,i(),o.trim())}catch(S){g($a(S))}finally{d(!1)}}return r?(0,qe.jsxs)("form",{className:"iad-inspection-question",onSubmit:h,"aria-label":"\u5411 Agent \u8FFD\u95EE",children:[(0,qe.jsxs)("label",{className:"iad-field",children:["\u8FFD\u95EE\u5185\u5BB9",(0,qe.jsx)("textarea",{"aria-label":"\u8FFD\u95EE\u5185\u5BB9",rows:3,value:o,disabled:l,onChange:v=>s(v.target.value)})]}),(0,qe.jsx)("p",{className:"iad-muted",children:"\u643A\u5E26\u5F53\u524D\u7591\u70B9\u3001\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u5B9E\u9645\u56FE\u50CF\u5F15\u7528\u3002"}),c&&(0,qe.jsx)("p",{role:"alert",className:"iad-error",children:c}),(0,qe.jsxs)("div",{className:"iad-actions",children:[(0,qe.jsx)(ig,{type:"submit",variant:"primary",disabled:l,children:l?"\u6B63\u5728\u63D0\u4EA4\u2026":"\u53D1\u9001\u5230\u4F1A\u8BDD"}),(0,qe.jsx)("button",{type:"button",disabled:l,onClick:()=>a(!1),children:"\u53D6\u6D88"})]})]}):(0,qe.jsx)("button",{onClick:()=>a(!0),children:"\u5411 Agent \u8FFD\u95EE"})}var C=I(L(),1);function Gs({inspection:e,selectedId:t,hoveredIds:i,regions:n,finding:r}){let{analysis:a}=e;return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)("svg",{className:"iad-roi-layer",viewBox:`0 0 ${a.overview.original_size.join(" ")}`,preserveAspectRatio:"none","aria-label":"\u5BA1\u8BA1\u533A\u57DF",children:n.map(o=>{let[s,l,d,c]=o.crop_bbox;return(0,C.jsx)("g",{"data-evidence-id":o.image.evidence_id,"data-locked":t===o.image.evidence_id,className:i.includes(o.image.evidence_id)?"is-hovered":"",children:(0,C.jsx)("rect",{x:s,y:l,width:d-s,height:c-l})},o.image.evidence_id)})}),r?.location.scope==="local"&&(0,C.jsx)("svg",{className:"iad-finding-layer","data-finding-id":r.finding_id,viewBox:`0 0 ${a.overview.original_size.join(" ")}`,preserveAspectRatio:"none","aria-label":r.location.description,children:(0,C.jsx)("rect",{x:r.location.bbox[0],y:r.location.bbox[1],width:r.location.bbox[2]-r.location.bbox[0],height:r.location.bbox[3]-r.location.bbox[1]})})]})}function qs({inspection:e,selection:t,onSelect:i,choices:n,transform:r}){let{analysis:a,reference:o}=e,{workspace:s,state:l}=or(),d=o.suggestion_id,{finding:c,evidence:g,region:h}=ci(a,t),v=h?.image.evidence_id||"",b=h?a.findings.filter(m=>m.evidence_ids.includes(h.image.evidence_id)):[];return(0,C.jsxs)("aside",{className:"iad-inspection-panel","aria-label":"\u5168\u56FE\u4E0E ROI \u7EFC\u5408\u5206\u6790",children:[e.historical&&(0,C.jsx)("p",{role:"status",children:"\u5386\u53F2\u5EFA\u8BAE\uFF0C\u4FDD\u7559\u8BE5\u6B21\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u56FE\u50CF\u8BC1\u636E\u3002"}),(0,C.jsx)(ag,{inspection:e,selection:t,transform:r}),!!a.consistency?.results.length&&(0,C.jsxs)("section",{"aria-label":"\u51BB\u7ED3\u4E00\u81F4\u6027\u8BC1\u636E",children:[(0,C.jsx)("h3",{children:"\u6570\u636E\u4E00\u81F4\u6027\u8BC1\u636E"}),a.consistency.results.map(m=>(0,C.jsx)("button",{onClick:()=>s.openLocation({pageId:"industrial-consistency",tab:"search",query:{kind:"sample",sample_id:o.sample_id},evidenceId:m.evidence_id,resultId:m.result_id,returnPage:l.pageId==="industrial-consistency"?void 0:l.pageId}),children:"\u67E5\u770B\u6BD4\u8F83\u8BC1\u636E"},m.result_id))]}),(0,C.jsx)("h2",{children:"\u7EFC\u5408\u5EFA\u8BAE"}),(0,C.jsx)("p",{children:a.conclusion.description}),(0,C.jsxs)("p",{className:"iad-muted",children:["\u4F4D\u7F6E\uFF1A",a.conclusion.position_analysis,(0,C.jsx)("br",{}),"\u5149\u7167\uFF1A",a.conclusion.illumination_analysis]}),!!a.findings.length&&(0,C.jsxs)("label",{className:"iad-field",children:["\u5BA1\u8BA1\u7591\u70B9",(0,C.jsxs)(ar,{"aria-label":"\u5BA1\u8BA1\u7591\u70B9",value:c?.finding_id||"",onChange:m=>i(m.target.value?{kind:"finding",id:m.target.value}:null),children:[(0,C.jsx)("option",{value:"",children:"\u9009\u62E9\u7591\u70B9"}),a.findings.map(m=>(0,C.jsxs)("option",{value:m.finding_id,children:[m.location.scope==="global"?"\u5168\u56FE":"\u5C40\u90E8","\uFF0C",m.location.description,"\uFF0C",m.description]},m.finding_id))]})]}),c&&(0,C.jsxs)("section",{className:"iad-inspection-finding","data-finding-id":c.finding_id,children:[(0,C.jsxs)("h3",{children:[c.location.scope==="global"?"\u5168\u56FE\u5173\u7CFB":"\u5C40\u90E8\u7591\u70B9","\uFF0C",c.location.description]}),(0,C.jsx)("p",{children:c.description}),(0,C.jsx)(eg,{finding:c}),(0,C.jsx)("p",{children:c.review_action}),(0,C.jsx)(Qs,{analysis:a,ids:c.evidence_ids,label:c.description,selectedId:g?.evidence_id||h?.image.evidence_id,onEvidence:m=>i({kind:"evidence",id:m.evidence_id,findingId:c.finding_id})})]}),!!n.length&&(0,C.jsxs)("div",{role:"group","aria-label":"\u91CD\u53E0\u533A\u57DF",children:[(0,C.jsx)("h3",{children:"\u9009\u62E9\u91CD\u53E0\u533A\u57DF"}),a.regions.filter(m=>n.includes(m.image.evidence_id)).map(m=>(0,C.jsxs)("button",{onClick:()=>i({kind:"evidence",id:m.image.evidence_id}),children:[m.label,"\uFF0C",m.crop_bbox.join(", ")]},m.image.evidence_id))]}),(0,C.jsx)("div",{className:"iad-roi-list","aria-label":"\u5BA1\u8BA1 ROI",children:a.regions.map((m,S)=>(0,C.jsxs)("button",{"aria-label":`\u5B9A\u4F4D ROI ${S+1}`,"aria-pressed":v===m.image.evidence_id,onClick:()=>i({kind:"evidence",id:m.image.evidence_id}),children:["ROI ",S+1,"\uFF0C",m.label]},m.image.evidence_id))}),h?(0,C.jsxs)("section",{className:"iad-inspection-region","data-evidence-id":h.image.evidence_id,children:[(0,C.jsxs)("h3",{children:[Us[h.source],"\uFF0C",h.label]}),(0,C.jsx)(Aa,{children:(0,C.jsx)(qi,{src:Xi(d,h.image),alt:"\u6240\u9009 ROI \u7684\u5B9E\u9645\u9001\u6A21\u88C1\u56FE","data-media-label":"ROI \u88C1\u56FE"})},h.image.evidence_id),(0,C.jsxs)("dl",{children:[(0,C.jsx)("dt",{children:"\u539F\u56FE\u533A\u57DF"}),(0,C.jsx)("dd",{children:h.bbox.join(", ")}),(0,C.jsx)("dt",{children:"\u5916\u6269\u88C1\u56FE"}),(0,C.jsx)("dd",{children:h.crop_bbox.join(", ")})]}),(0,C.jsx)("p",{children:h.observation.description}),(0,C.jsxs)("p",{children:["\u4F4D\u7F6E\uFF1A",h.observation.position_analysis]}),(0,C.jsxs)("p",{children:["\u5149\u7167\uFF1A",h.observation.illumination_analysis]}),!c&&!!b.length&&(0,C.jsx)("div",{className:"iad-related-findings iad-actions","aria-label":"ROI \u5173\u8054\u7591\u70B9",children:b.map(m=>(0,C.jsxs)("button",{"data-finding-id":m.finding_id,onClick:()=>i({kind:"finding",id:m.finding_id}),children:[m.location.description,"\uFF0C",m.description]},m.finding_id))})]}):!g&&!c&&(0,C.jsx)("p",{className:"iad-muted",children:"\u70B9\u9009\u56FE\u4E2D\u533A\u57DF\u6216 ROI \u6309\u94AE\u67E5\u770B\u5B9E\u9645\u88C1\u56FE\u3002"}),g&&g.representation!=="raw"&&(0,C.jsxs)("section",{className:"iad-inspection-mask","data-evidence-id":g.evidence_id,children:[(0,C.jsx)("h3",{children:g.representation==="annotation_mask"?"\u6807\u6CE8\u5B9A\u4F4D\u56FE":"\u6807\u6CE8\u53E0\u52A0\u56FE"}),(0,C.jsx)(Aa,{children:(0,C.jsx)(qi,{src:Xi(d,g),alt:"\u6240\u9009\u6807\u6CE8\u7684\u5B9E\u9645\u9001\u6A21\u56FE","data-media-label":"\u6807\u6CE8\u8BC1\u636E"})},g.evidence_id),(0,C.jsxs)("p",{children:["\u539F\u56FE\u5750\u6807\uFF1A",g.crop_bbox.join(", ")]})]}),g?.role==="overview"&&(0,C.jsxs)("section",{className:"iad-inspection-overview","data-evidence-id":g.evidence_id,children:[(0,C.jsx)("h3",{children:"\u5168\u56FE\u89C2\u5BDF"}),(0,C.jsx)("p",{children:a.global_view.description}),(0,C.jsxs)("p",{children:["\u4F4D\u7F6E\uFF1A",a.global_view.position_analysis]}),(0,C.jsxs)("p",{children:["\u5149\u7167\uFF1A",a.global_view.illumination_analysis]})]}),(0,C.jsxs)("details",{children:[(0,C.jsx)("summary",{children:"\u7248\u672C\u4E0E\u8BC1\u636E\u8303\u56F4"}),(0,C.jsx)("p",{children:(0,C.jsx)("code",{children:a.normal_version_id})}),(0,C.jsxs)("p",{children:["\u5B9E\u9645\u7EC6\u770B ",a.coverage.inspected_regions," / ",a.coverage.planned_regions," \u4E2A ROI"]}),a.coverage.missing.map((m,S)=>(0,C.jsx)("p",{children:m},S))]})]})}var sr=I(V(),1);var og=I(V(),1);var lg=I(L(),1);var sg=I(L(),1);var rt=I(L(),1);function dg({image:e,onClose:t,navigation:i,collection:n}){let[r,a]=(0,fi.useState)(n?.index||0),[o,s]=(0,fi.useState)(e.initialSelection||null),l=(0,fi.useRef)(e.initialTransform||{zoom:0,x:0,y:0}),d=(0,fi.useCallback)(S=>{l.current=S},[]),c=n?.images[r]?.image||e,g=c.inspection,{finding:h,region:v}=ci(g?.analysis,o),b=n?(0,rt.jsxs)("div",{children:[(0,rt.jsx)("h3",{children:n.title}),(0,rt.jsx)("p",{children:n.instruction}),(0,rt.jsx)("div",{className:"iad-thumbnail-grid",children:n.images.map((S,u)=>(0,rt.jsx)(Xa,{src:S.image.src,label:S.label,"aria-current":u===r,onClick:()=>a(u)},S.id))})]}):g?(0,rt.jsx)(qs,{inspection:g,selection:o,choices:[],onSelect:s,transform:()=>l.current}):void 0,m=n?.images.map(S=>({id:S.id,title:S.image.title,imageUrl:S.image.src,width:S.image.width,height:S.image.height,annotationLayer:S.image.annotationLayer,qualityLabel:S.image.qualityLabel,sampleId:S.image.sampleId,evidence:S.image.evidence}));return(0,rt.jsx)(Jf,{open:!0,item:{id:c.src,title:c.title,imageUrl:c.src,width:c.width,height:c.height,annotationLayer:c.annotationLayer,qualityLabel:c.qualityLabel,sampleId:c.sampleId,evidence:c.evidence},items:m,currentIndex:r,onNavigate:n?a:void 0,navigation:i,context:b,initialTransform:c.initialTransform,onTransform:d,onClose:t,overlay:g&&(0,rt.jsx)(Gs,{inspection:g,selectedId:v?.image.evidence_id||"",hoveredIds:[],regions:g.analysis.regions,finding:h}),onImageClick:g?S=>{let u=g.analysis.regions.find(p=>S[0]>=p.crop_bbox[0]&&S[0]<=p.crop_bbox[2]&&S[1]>=p.crop_bbox[1]&&S[1]<=p.crop_bbox[3]);u&&s({kind:"evidence",id:u.image.evidence_id})}:void 0})}var Kt=I(L(),1);function dr({items:e,imageUrl:t}){let i=(0,gi.useRef)(null),[n,r]=(0,gi.useState)({page:1,size:8}),[a,o]=(0,gi.useState)(null);if((0,gi.useLayoutEffect)(()=>{if(!e.length)return;let l=i.current,d=new ResizeObserver(()=>{if(!l.getBoundingClientRect().width)return;let c=getComputedStyle(l).gridTemplateColumns.split(" ").length*2;r(g=>g.size===c?g:{page:1,size:c})});return d.observe(l),()=>d.disconnect()},[e.length]),!e.length)return null;let s=e.map(l=>({src:t(l),title:l.source.sample.relative_path.split("/").pop(),width:l.image.original_size[0],height:l.image.original_size[1],sampleId:l.sample_id,evidence:l.image,...Rf(l.source.dataset_format,l.source.sample,l.source.annotations)}));return(0,Kt.jsxs)("section",{className:"iad-audit-gallery","aria-label":"\u56FE\u50CF\u8BC1\u636E",children:[(0,Kt.jsx)("h4",{children:"\u56FE\u50CF\u8BC1\u636E"}),(0,Kt.jsx)("div",{ref:i,className:"iad-thumbnail-grid",children:s.slice((n.page-1)*n.size,n.page*n.size).map((l,d)=>{let c=(n.page-1)*n.size+d;return(0,Kt.jsx)(Xa,{image:l,label:"",title:l.title,"data-audit-evidence-role":e[c].role,"aria-label":`\u653E\u5927${l.title}`,onClick:()=>o(c)},e[c].image.evidence_id)})}),(0,Kt.jsx)(zf,{total:e.length,page:n.page,size:n.size,unit:"\u5F20",label:"\u56FE\u50CF\u8BC1\u636E",hideSinglePage:!0,onPage:l=>r(d=>({...d,page:l}))}),a!==null&&(0,Kt.jsx)(dg,{image:s[a],onClose:()=>o(null),navigation:e.length>1?{previous:a>0,next:a<e.length-1,busy:!1,error:"",move:l=>o(a+l)}:void 0})]})}var at=I(L(),1);function Ws({kind:e,title:t,rows:i,unit:n}){let r=Math.max(1,...i.map(o=>o.value)),a={gridTemplateColumns:`repeat(${i.length},minmax(0,1fr))`};return(0,at.jsxs)("figure",{className:"iad-audit-chart","data-chart":e,children:[(0,at.jsx)("figcaption",{children:t}),(0,at.jsx)("div",{className:"iad-audit-chart-bars",style:a,role:"img","aria-label":i.map(o=>`${o.label} ${o.value} ${n}`).join("\uFF1B"),children:i.map(o=>(0,at.jsxs)("div",{className:"iad-audit-chart-column",children:[(0,at.jsx)("span",{className:"iad-audit-chart-value",children:o.value.toLocaleString("zh-CN")}),(0,at.jsx)("span",{className:"iad-audit-chart-bar",style:{height:`${o.value/r*85}%`}})]},o.label))}),(0,at.jsx)("div",{className:"iad-audit-chart-labels",style:a,"aria-hidden":"true",children:i.map(o=>(0,at.jsx)("span",{children:o.label},o.label))})]})}var x=I(L(),1),Hx={physical_sample_id:"\u7269\u7406\u4EF6",capture_sequence_id:"\u91C7\u96C6\u5E8F\u5217",batch_id:"\u6279\u6B21",station:"\u7AD9\u70B9",camera:"\u76F8\u673A",data_origin:"\u6765\u6E90"};function pg({report:e,imageUrl:t}){let i=e.statistics,n=e.dataset_profile,{coverage_topics:r=[],consistency_analyses:a=[]}=e,o=n?Mc[n.dataset_format]:Object.keys(i?.issue_types||{}),s=e.capabilities.some(l=>l.readiness_status!=="not_evaluated");return(0,x.jsxs)("article",{className:"iad-audit-document",children:[(0,x.jsxs)("header",{className:"iad-audit-report-intro",children:[(0,x.jsx)("h1",{children:"\u6A21\u578B\u5BA1\u8BA1\u62A5\u544A"}),(0,x.jsx)("p",{children:Object.values(e.dataset_names).join("\u3001")}),(0,x.jsxs)("div",{className:"iad-audit-report-meta",children:[(0,x.jsxs)("span",{children:["\u5BA1\u8BA1\u8986\u76D6 ",e.audited_samples," / ",e.total_samples," \u5F20"]}),e.model_name&&(0,x.jsxs)("span",{children:["\u5BA1\u8BA1\u6A21\u578B ",e.model_name]}),e.finished_at&&(0,x.jsxs)("span",{children:["\u62A5\u544A\u5B8C\u6210\u65F6\u95F4 ",new Date(e.finished_at).toLocaleString("zh-CN",{hour12:!1})]}),n&&(0,x.jsxs)("span",{children:["\u6570\u636E\u683C\u5F0F ",n.dataset_format==="labelme"?"Labelme":"\u76EE\u5F55\u5206\u7C7B"]})]})]}),(0,x.jsxs)("section",{className:"iad-report-section",children:[(0,x.jsx)("h2",{children:"\u603B\u4F53\u7ED3\u8BBA\u4E0E\u7EDF\u8BA1"}),(0,x.jsx)("p",{children:e.conclusion||"\u6574\u4F53\u5206\u6790\u5C1A\u672A\u5B8C\u6210\u3002"}),(0,x.jsx)(Ws,{kind:"outcomes",title:"\u672C\u8F6E\u5BA1\u8BA1\u7ED3\u679C",unit:"\u5F20",rows:[{label:"\u5BA1\u8BA1\u6B63\u5E38",value:i?.normal_images??e.distribution.normal??0},{label:"\u53D1\u73B0\u7591\u70B9",value:e.suspect_samples},{label:"\u672A\u5B8C\u6210",value:e.total_samples-e.audited_samples}]})]}),(0,x.jsxs)("section",{className:"iad-report-section",children:[(0,x.jsx)("h2",{children:"\u6807\u6CE8\u8D28\u91CF\u4E0E\u7591\u70B9"}),i?(0,x.jsxs)(x.Fragment,{children:[(0,x.jsxs)("p",{children:["\u4FDD\u7559\u6A21\u578B\u7591\u70B9 ",i.suspect_images," \u5F20\u56FE\u50CF\uFF0C",i.issue_occurrences," \u9879\u3002",i.suspect_rate_among_completed!==null&&(0,x.jsxs)(x.Fragment,{children:["\u5360\u5DF2\u5B8C\u6210\u56FE\u50CF\u7684 ",(100*i.suspect_rate_among_completed).toLocaleString("zh-CN",{maximumFractionDigits:2}),"%\u3002"]})]}),(0,x.jsxs)("p",{children:["\u666E\u901A\u89C2\u5BDF ",i.observation_images," \u5F20\u56FE\u50CF\uFF0C",i.observation_occurrences," \u6761\u3002\u666E\u901A\u89C2\u5BDF\u4E0D\u8BA1\u5165\u8D28\u91CF\u7591\u70B9\uFF0C\u6A21\u578B\u7591\u70B9\u9700\u4EBA\u5DE5\u590D\u6838\u3002"]})]}):(0,x.jsx)("p",{children:"\u672C\u4F5C\u4E1A\u5C1A\u65E0\u8D28\u91CF\u6C47\u603B\u7EDF\u8BA1\u3002"})]}),(0,x.jsxs)("section",{className:"iad-report-section",children:[(0,x.jsx)("h2",{children:"\u8986\u76D6\u753B\u50CF"}),(0,x.jsx)("p",{children:e.coverage_analysis}),r.map((l,d)=>(0,x.jsxs)("article",{className:"iad-audit-discovery",children:[(0,x.jsx)("h3",{children:l.title}),(0,x.jsx)("p",{children:l.analysis}),(0,x.jsx)(dr,{items:e.evidence_groups["coverage:"+d]||[],imageUrl:t})]},d)),(0,x.jsx)("h3",{children:"\u72EC\u7ACB\u6027\u4E0E\u4EE3\u8868\u6027"}),(0,x.jsx)("p",{children:e.independence_analysis}),n&&(0,x.jsxs)("dl",{className:"iad-report-data",children:[Object.entries(n.metadata).filter(([,l])=>l.covered_images>0).map(([l,d])=>(0,x.jsxs)("div",{children:[(0,x.jsx)("dt",{children:Hx[l]}),(0,x.jsxs)("dd",{children:[d.distinct_count," \u79CD\u767B\u8BB0\u503C\uFF0C\u8986\u76D6 ",d.covered_images," / ",n.total_images," \u5F20\u56FE\u50CF"]})]},l)),n.strict_duplicate_groups!==null&&(0,x.jsxs)("div",{children:[(0,x.jsx)("dt",{children:"\u4E25\u683C\u91CD\u590D"}),(0,x.jsxs)("dd",{children:[n.strict_duplicate_groups," \u7EC4\uFF0C\u6D89\u53CA ",n.strict_duplicate_images," \u5F20\u56FE\u50CF"]})]}),n.near_candidate_pairs>0&&(0,x.jsxs)("div",{children:[(0,x.jsx)("dt",{children:"\u76F8\u8FD1\u5019\u9009"}),(0,x.jsxs)("dd",{children:[n.near_candidate_pairs," \u5BF9"]})]})]})]}),(0,x.jsxs)("section",{className:"iad-report-section",children:[(0,x.jsx)("h2",{children:"\u6570\u636E\u4E00\u81F4\u6027\u5206\u6790"}),(0,x.jsx)("p",{children:e.consistency_analysis}),!!o.length&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)(Ws,{kind:"issues",title:"\u5404\u7C7B\u6A21\u578B\u7591\u70B9\u6570",unit:"\u9879",rows:o.map(l=>({label:Cs[l],value:i?.issue_types[l]?.occurrences??0}))}),o.map(l=>{let d=a.find(g=>g.issue_type===l),c=i?.issue_types[l];return(0,x.jsxs)("article",{className:"iad-audit-discovery",children:[(0,x.jsx)("h3",{children:Cs[l]}),i&&(0,x.jsxs)("p",{className:"iad-audit-scope",children:[c?.image_count??0," \u5F20\u56FE\u50CF\uFF0C",c?.occurrences??0," \u9879\u6A21\u578B\u7591\u70B9"]}),d&&(0,x.jsx)("p",{children:d.analysis}),(0,x.jsx)(dr,{items:e.evidence_groups["consistency:"+l]||[],imageUrl:t})]},l)})]})]}),(0,x.jsxs)("section",{className:"iad-report-section",children:[(0,x.jsx)("h2",{children:"\u6570\u636E\u7528\u9014\u4E0E\u53EF\u8BC4\u6D4B\u80FD\u529B"}),!!e.usability.length&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)("h3",{children:"\u6570\u636E\u7528\u9014"}),(0,x.jsx)("div",{className:"iad-table-scroll",children:(0,x.jsxs)("table",{className:"iad-audit-report-table",children:[(0,x.jsx)("thead",{children:(0,x.jsxs)("tr",{children:[(0,x.jsx)("th",{scope:"col",children:"\u7528\u9014"}),(0,x.jsx)("th",{scope:"col",children:"\u672C\u6B21\u5224\u65AD"}),(0,x.jsx)("th",{scope:"col",children:"\u5B9E\u9645\u4F9D\u636E"})]})}),(0,x.jsx)("tbody",{children:e.usability.map(l=>(0,x.jsxs)("tr",{children:[(0,x.jsx)("th",{scope:"row",children:jc[l.purpose]}),(0,x.jsx)("td",{children:(0,x.jsx)("span",{className:"iad-audit-status","data-status":l.status,children:Ac[l.status]})}),(0,x.jsx)("td",{children:l.reason})]},l.purpose))})]})})]}),!!e.capabilities.length&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)("h3",{children:"\u53EF\u8BC4\u6D4B\u80FD\u529B"}),(0,x.jsx)("div",{className:"iad-table-scroll",children:(0,x.jsxs)("table",{className:"iad-audit-report-table",children:[(0,x.jsx)("thead",{children:(0,x.jsxs)("tr",{children:[(0,x.jsx)("th",{scope:"col",children:"\u80FD\u529B"}),(0,x.jsx)("th",{scope:"col",children:"\u8986\u76D6\u60C5\u51B5"}),(0,x.jsx)("th",{scope:"col",children:"\u5B9E\u9645\u4F9D\u636E\u4E0E\u7F3A\u5931\u6761\u4EF6"}),s&&(0,x.jsx)("th",{scope:"col",children:"\u6B63\u5F0F\u5C31\u7EEA"})]})}),(0,x.jsx)("tbody",{children:e.capabilities.map(l=>(0,x.jsxs)("tr",{children:[(0,x.jsx)("th",{scope:"row",children:Es[l.tag]}),(0,x.jsx)("td",{children:(0,x.jsx)("span",{className:"iad-audit-status","data-status":l.coverage_status,children:Tc[l.coverage_status]})}),(0,x.jsxs)("td",{children:[l.reason,!!l.missing_conditions.length&&(0,x.jsx)("p",{children:l.missing_conditions.join("\uFF1B")})]}),s&&(0,x.jsxs)("td",{children:[l.readiness_track&&(0,x.jsxs)(x.Fragment,{children:[l.readiness_track,(0,x.jsx)("br",{})]}),_s[l.readiness_status]]})]},l.tag))})]})}),e.capabilities.filter(l=>e.evidence_groups["capability:"+l.tag]?.length).map(l=>(0,x.jsxs)("article",{className:"iad-audit-discovery",children:[(0,x.jsx)("h3",{children:Es[l.tag]}),(0,x.jsx)(dr,{items:e.evidence_groups["capability:"+l.tag],imageUrl:t})]},l.tag))]}),n?.benchmark&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)("h3",{children:"\u5DF2\u6709 Benchmark \u6210\u679C"}),(0,x.jsxs)("p",{children:["\u5212\u5206\u8986\u76D6\u672C\u6B21\u5BA1\u8BA1 ",n.benchmark.covered_images," / ",n.total_images," \u5F20\u56FE\u50CF\uFF0C",n.benchmark.source_matches_scope?"\u4E0E\u5BA1\u8BA1\u8303\u56F4\u4E00\u81F4\u3002":"\u6210\u679C\u8303\u56F4\u4E0E\u5BA1\u8BA1\u8303\u56F4\u4E0D\u540C\u3002"]}),(0,x.jsx)("div",{className:"iad-table-scroll",children:(0,x.jsxs)("table",{className:"iad-audit-report-table",children:[(0,x.jsx)("thead",{children:(0,x.jsxs)("tr",{children:[(0,x.jsx)("th",{scope:"col",children:"\u8BC4\u6D4B\u8F68\u9053"}),(0,x.jsx)("th",{scope:"col",children:"\u5C31\u7EEA\u60C5\u51B5"}),(0,x.jsx)("th",{scope:"col",children:"\u5DF2\u6709\u4F9D\u636E"})]})}),(0,x.jsx)("tbody",{children:Object.entries(n.benchmark.readiness).map(([l,d])=>(0,x.jsxs)("tr",{children:[(0,x.jsx)("th",{scope:"row",children:d.track_name}),(0,x.jsx)("td",{children:_s[d.status.toLowerCase()]}),(0,x.jsx)("td",{children:d.reason})]},l))})]})})]})]}),(0,x.jsxs)("section",{className:"iad-report-section",children:[(0,x.jsx)("h2",{children:"\u5173\u952E\u53D1\u73B0\u4E0E\u89C4\u5F8B"}),e.discoveries.length?e.discoveries.map(l=>(0,x.jsxs)("article",{className:"iad-audit-discovery","data-audit-discovery":l.group_id,children:[(0,x.jsxs)("header",{children:[(0,x.jsx)("h3",{children:l.title}),(0,x.jsx)("span",{className:"iad-audit-status","data-status":l.status,children:Oc[l.status]})]}),(0,x.jsx)("p",{children:l.description}),l.annotation_relation&&(0,x.jsx)("p",{children:l.annotation_relation}),l.key_difference&&(0,x.jsx)("p",{children:l.key_difference}),(0,x.jsxs)("p",{className:"iad-audit-scope",children:["\u6D89\u53CA ",l.affected_image_count," \u5F20\u56FE\u50CF\uFF1B",l.scope]}),l.unresolved_question&&(0,x.jsx)("p",{children:l.unresolved_question}),(0,x.jsx)(dr,{items:e.evidence_groups[l.group_id]||[],imageUrl:t})]},l.group_id)):(0,x.jsx)("p",{children:"\u672C\u4F5C\u4E1A\u5C1A\u65E0\u6B63\u5F0F\u4FDD\u5B58\u7684\u5173\u952E\u53D1\u73B0\u3002"})]}),(0,x.jsxs)("section",{className:"iad-report-section",children:[(0,x.jsx)("h2",{children:"\u5BA1\u8BA1\u4F9D\u636E\u4E0E\u9002\u7528\u8FB9\u754C"}),(0,x.jsx)("p",{children:"\u4F9D\u636E\u672C\u6B21\u51BB\u7ED3\u539F\u56FE\u3001\u539F\u59CB\u6807\u6CE8\u3001\u9010\u56FE\u5BA1\u8BA1\u7ED3\u679C\u548C\u6240\u9009\u6570\u636E\u4E00\u81F4\u6027\u7ED3\u679C\u3002"}),Object.keys(e.knowledge_titles).length?(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)("h3",{children:"\u6240\u9009\u77E5\u8BC6\u7684\u5B9E\u9645\u4F5C\u7528"}),(0,x.jsx)("p",{children:Object.values(e.knowledge_titles).join("\u3001")}),e.knowledge_analysis&&(0,x.jsx)("p",{children:e.knowledge_analysis})]}):(0,x.jsx)("p",{children:"\u672C\u6B21\u672A\u9009\u7528\u77E5\u8BC6\u6761\u76EE\u3002"}),!!e.review_priorities.length&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)("h3",{children:"\u590D\u6838\u91CD\u70B9"}),(0,x.jsx)("ul",{children:e.review_priorities.map((l,d)=>(0,x.jsx)("li",{children:l},d))})]}),!!e.limitations.length&&(0,x.jsxs)(x.Fragment,{children:[(0,x.jsx)("h3",{children:"\u9002\u7528\u8FB9\u754C"}),e.limitations.map((l,d)=>(0,x.jsx)("p",{children:l},d))]})]})]})}var Qx="--iad-canvas:#141B25;--iad-surface:#202B3A;--iad-navigation:#182231;--iad-surface-muted:#293648;--iad-text:#EDF2F8;--iad-muted:#B4C0D0;--iad-border:#4C5B6E;--iad-panel-border:var(--iad-border);--iad-section-border:var(--iad-border);--iad-control-border:#8393AA;--iad-primary:#A7C5FF;--iad-primary-fill:#315FC9;--iad-hover:#293E60;--iad-success:#92D7B0;--iad-warning:#F3C280;--iad-danger:#FFB7B1;--iad-viewer:#10161F;",ug=`
:root {
 --iad-canvas:#F5F7FA;
 --iad-surface:#fff;
 --iad-navigation:#F5F7FA;
 --iad-surface-muted:#F2F5F9;
 --iad-text:#172338;
 --iad-muted:#536174;
 --iad-border:#CBD3DE;
 --iad-panel-border:#DBE2EB;
 --iad-section-border:#E2E8F0;
 --iad-control-border:#B9C7D9;
 --iad-primary:#285ED6;
 --iad-primary-fill:#285ED6;
 --iad-primary-hover:#1E51C2;
 --iad-on-primary:#fff;
 --iad-hover:#EAF0FE;
 --iad-danger:#B42318;
 --iad-success:#166344;
 --iad-warning:#8A4B06;
 --iad-success-badge:color-mix(in srgb,var(--iad-success) 45%,#000);
 --iad-viewer:#202833;
 --iad-on-viewer:#fff;
 --iad-viewer-edge-fill:rgba(15,25,36,.76);--iad-viewer-edge-hover:rgba(35,48,65,.94);
 --iad-viewer-edge-border:#4B5C70;--iad-viewer-edge-hover-border:#8294A8;--iad-viewer-edge-shadow:rgba(0,0,0,.1);
 --iad-scrim:#101b2bd9;
 --iad-radius:5px;
 --iad-control-height:38px;
 --iad-field-width:220px;
 --iad-dataset-width:250px;
 --iad-subset-width:390px;
 --iad-icon-size:18px;
 --iad-row-action-size:32px;
 --iad-tab-height:44px;
 --iad-font-family:system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
 --iad-font-size:13px;
 --iad-space-1:.25rem;--iad-space-2:.5rem;--iad-space-3:.75rem;--iad-space-4:1rem;--iad-space-6:1.5rem;--iad-space-8:2rem;--iad-space-12:3rem;
 --iad-page-padding:var(--iad-space-8);--iad-section-gap:var(--iad-space-6);--iad-field-gap:var(--iad-space-4);
 --iad-title-size:calc(var(--dsh-content-font-size,.875rem)*2);--iad-section-size:calc(var(--dsh-content-font-size,.875rem)*1.285714);--iad-group-size:calc(var(--dsh-content-font-size,.875rem)*1.071429);
}
[data-ds-dark-theme] {${Qx}}
[data-shortcut-modal="settings"] > nav {border-inline-end:1px solid var(--iad-panel-border)}
`;var cg=`
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {font:inherit;font-size:var(--iad-font-size);line-height:1.5;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);min-height:var(--iad-control-height);padding:8px 12px;transition:background-color 140ms,border-color 140ms;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:hover:not(:disabled) {background:var(--iad-hover);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:disabled {cursor:default;opacity:1;background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-danger {color:var(--iad-danger);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-width:0;max-width:100%;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 10px;min-height:var(--iad-control-height);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input,textarea)::placeholder {color:var(--iad-muted);opacity:1;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-height:80px;resize:vertical;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(button,input,select,textarea,summary,[tabindex]):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input[type=checkbox],input[type=radio]) {appearance:auto;flex:none;min-height:15px;height:15px;width:15px;padding:0;margin:0;accent-color:var(--iad-primary);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog) button.iad-job-status-button {border:0;border-radius:0;background:transparent;padding:0;min-height:32px;text-align:left;font:inherit;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog) button.iad-job-status-button:hover {background:transparent;text-decoration:underline;}
button.iad-button {display:inline-flex;align-items:center;justify-content:center;gap:var(--iad-space-2);box-sizing:border-box;height:var(--iad-control-height);min-height:var(--iad-control-height);padding:0 14px;font-size:var(--iad-font-size);font-weight:400;line-height:1.4;white-space:nowrap;}
button.iad-button svg {width:var(--iad-icon-size);height:var(--iad-icon-size);fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
button.iad-button[data-variant=primary] {background:var(--iad-primary-fill);border-color:var(--iad-primary-fill);color:var(--iad-on-primary);font-weight:500;}
button.iad-button[data-variant=primary]:hover:not(:disabled) {background:var(--iad-primary-hover);border-color:var(--iad-primary-hover);}
button.iad-button[data-variant=danger] {background:var(--iad-danger);border-color:var(--iad-danger);color:var(--iad-on-primary);font-weight:500;}
button.iad-button[data-variant=danger]:hover:not(:disabled) {background:color-mix(in srgb,var(--iad-danger) 85%,#000);border-color:color-mix(in srgb,var(--iad-danger) 85%,#000);}
button.iad-button:disabled {background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border);font-weight:400;}
@media(prefers-reduced-motion:reduce) {:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {transition:none;}}
/* Icon controls share geometry and interaction states in every page and dialog. */
button.iad-icon-button {
  display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;
  width:var(--iad-icon-button-size,var(--iad-control-height));min-width:var(--iad-icon-button-size,var(--iad-control-height));max-width:var(--iad-icon-button-size,var(--iad-control-height));
  height:var(--iad-icon-button-size,var(--iad-control-height));min-height:var(--iad-icon-button-size,var(--iad-control-height));max-height:var(--iad-icon-button-size,var(--iad-control-height));
  padding:0;flex:none;border:1px solid transparent;border-radius:var(--iad-radius);
  background:transparent;color:var(--iad-icon-color,var(--iad-muted));cursor:pointer;
  font:inherit;line-height:1;box-shadow:none;transition:background-color 140ms,color 140ms;
}
button.iad-icon-button svg {display:block;width:var(--iad-icon-size);height:var(--iad-icon-size);flex:none;}
button.iad-icon-button:hover:not(:disabled) {background:var(--iad-icon-hover-background,var(--iad-hover));color:var(--iad-icon-hover-color,var(--iad-primary));border-color:transparent;}
button.iad-icon-button[data-icon=delete]:hover:not(:disabled) {background:color-mix(in srgb,var(--iad-danger) 10%,transparent);color:var(--iad-danger);}
button.iad-icon-button:focus-visible {outline:2px solid var(--iad-icon-focus,var(--iad-primary));outline-offset:2px;}
button.iad-icon-button:disabled {opacity:.4;cursor:not-allowed;background:transparent;color:var(--iad-icon-color,var(--iad-muted));border-color:transparent;}
:is(.iad-workbench,.iad-detail-dialog) table {--iad-icon-button-size:var(--iad-row-action-size);}
dialog.iad-detail-dialog {--iad-icon-button-size:var(--iad-control-height);}
.iad-filter-action {align-self:flex-end;}
.full-toolbar {--iad-icon-color:var(--iad-on-viewer);--iad-icon-hover-color:var(--iad-on-viewer);--iad-icon-hover-background:rgba(255,255,255,.16);--iad-icon-focus:#a1c6ff;}
`;var fg=`
.iad-model-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:0 0 16px}.iad-model-fields .iad-field{min-width:0;margin:0}.iad-provider-manager{min-width:0}.iad-provider-manager>.iad-muted{margin-bottom:20px}.iad-provider-manager>.iad-table-scroll{background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-provider-manager input{max-width:100%}.iad-provider-endpoint{overflow-wrap:anywhere;max-width:420px}.iad-provider-dialog{width:min(780px,calc(100vw - 32px))}.iad-provider-dialog fieldset{border:0;padding:0;margin:0;min-width:0}.iad-provider-model{padding:12px 16px;margin:12px 0;background:var(--iad-surface-muted);border-radius:8px}.iad-provider-model .iad-row{justify-content:space-between}
`;var gg=`
dialog.iad-detail-dialog.iad-dialog-form.exp-source-dialog{height:min(var(--iba-dialog-max-height),calc(100dvh - 2 * var(--iba-dialog-gap)))!important}
.exp-source-dialog .exp-source-body{display:grid;grid-template-rows:auto minmax(0,1fr) 44px;gap:16px;overflow:hidden}
.exp-source-dialog .exp-source-filters{display:grid;grid-template-columns:minmax(160px,1fr) 205px 175px auto 40px;gap:12px;align-items:end;margin:0;min-width:0}
.exp-source-dialog .exp-source-filters .iad-field{margin:0;min-width:0;gap:6px}
.exp-source-dialog .exp-source-filters input[type=search],.exp-source-dialog .exp-source-filters .iad-select{width:100%;height:38px;min-width:0}
.exp-source-dialog .exp-source-filters .iad-multiselect{min-width:0;width:100%}
.exp-source-dialog .exp-source-search-field{grid-column:1}
.exp-source-dialog .exp-source-child-field{grid-column:2}
.exp-source-dialog .exp-source-category-field{grid-column:3;min-width:0}
.exp-source-dialog .exp-source-only{grid-column:4;min-height:38px;white-space:nowrap;margin:0}
.exp-source-dialog .exp-source-filters>.iad-filter-action{grid-column:5;min-height:38px}
.exp-source-dialog .exp-source-scroll{min-height:0;min-width:0;overflow-y:auto;scrollbar-gutter:stable;overscroll-behavior:contain}
.exp-source-dialog .iad-thumbnail-grid{grid-auto-rows:max-content}
.exp-source-dialog .iad-thumbnail-option{display:grid;justify-items:start;align-content:start;gap:6px;min-width:0}
.exp-source-dialog .exp-source-pagination{min-width:0;align-self:end;min-height:44px}
.exp-source-dialog .exp-source-pagination .iad-pagination{margin:0}
@media(max-width:620px){.exp-source-dialog .exp-source-body{grid-template-rows:auto minmax(0,1fr) 88px}.exp-source-dialog .exp-source-pagination{min-height:88px}}
@media(max-width:750px){.exp-source-dialog .exp-source-filters{grid-template-columns:repeat(2,minmax(0,1fr)) 40px}.exp-source-dialog .exp-source-search-field{grid-column:1/-1}.exp-source-dialog .exp-source-child-field{grid-column:1;grid-row:2}.exp-source-dialog .exp-source-category-field{grid-column:2/-1;grid-row:2}.exp-source-dialog .exp-source-only{grid-column:1/3;grid-row:3}.exp-source-dialog .exp-source-filters>.iad-filter-action{grid-column:3;grid-row:3}}
.iad-exploration-page{min-width:0}.iad-job-sync{display:flex;align-items:center;flex-wrap:wrap;gap:12px 20px;min-height:44px;margin-bottom:20px;font-size:.8125rem}.iad-job-sync button{margin-left:auto}.iad-job-sync[data-state=stale]{padding:12px 16px;border-left:3px solid var(--iad-warning);background:var(--iad-surface);color:var(--iad-warning)}
.iad-exploration-page textarea{width:100%}
.iad-exploration-page .iad-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:280px;padding:40px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}.iad-exploration-page .iad-empty h2{margin:0;color:var(--iad-text)}.iad-exploration-page .iad-empty p{max-width:480px}.iad-exploration-page .iad-empty button{margin-top:8px}
.iad-exploration-results{min-width:0}.iad-exploration-results>.iad-muted{margin-bottom:20px}.iad-exploration-results>.iad-table-scroll{background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}
.iad-exploration-summary{margin-bottom:20px}.iad-exploration-summary>p{line-height:1.8;overflow-wrap:anywhere}.iad-exploration-summary>p[data-expanded=false]{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.iad-exploration-results .iad-section-header>select{min-width:260px;max-width:100%}.iad-exploration-results .iad-resource-table th:nth-child(2){width:20%}.iad-exploration-results .iad-resource-table th:nth-child(3){width:80px}.iad-exploration-results .iad-resource-table th:last-child{width:160px}.iad-exploration-results .iad-resource-table td{padding:12px 16px}.iad-exploration-results .iad-resource-table td:first-child{overflow-wrap:anywhere}
.iad-exploration-limitations{margin-top:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);overflow:hidden}.iad-exploration-limitations>summary{list-style:none;display:flex;align-items:center;gap:13px;min-height:54px;padding:0 18px;cursor:pointer;user-select:none}.iad-exploration-limitations>summary::-webkit-details-marker{display:none}.iad-exploration-limitations>summary:hover{background:var(--iad-hover)}.iad-exploration-limitations>summary:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}.iad-exploration-limitations>summary>.iad-muted,.iad-limit-count{font-size:.75rem;color:var(--iad-muted)}.iad-limit-count{margin-left:auto;white-space:nowrap}.iad-limit-chevron{flex:none;color:var(--iad-muted);transition:transform .15s ease}.iad-exploration-limitations[open] .iad-limit-chevron{transform:rotate(90deg)}.iad-limit-list{list-style:none;counter-reset:iad-limitation;margin:0;padding:0 18px;border-top:1px solid var(--iad-border)}.iad-limit-list>li{counter-increment:iad-limitation;display:grid;grid-template-columns:115px minmax(0,1fr);gap:14px;padding:13px 0;line-height:1.8;color:var(--iad-muted);overflow-wrap:anywhere}.iad-limit-list>li::before{content:counter(iad-limitation,decimal-leading-zero);font-weight:600}.iad-limit-list>li+li{border-top:1px solid var(--iad-border)}
@container workbench (max-width:1180px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr) 320px}.iad-exploration-jobs-layout{grid-template-columns:minmax(0,1fr)}}
@container workbench (max-width:960px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr)}.iad-exploration-side{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}}

.iad-detail-dialog.iad-direction-dialog{width:min(1280px,calc(100vw - 64px));height:fit-content;max-height:calc(100dvh - 64px);overflow:hidden;padding:0;display:flex;flex-direction:column}.iad-direction-dialog .iad-dialog-header{position:static;flex:none;padding:22px 28px 14px;margin:0;top:0}.iad-direction-dialog .iad-dialog-header h2{font-size:1.3125rem}.iad-direction-body{min-height:0;overflow:auto;padding:0 28px 20px}.iad-direction-meta{display:flex;gap:16px;flex-wrap:wrap;color:var(--iad-muted);font-size:.75rem;padding:14px 0 20px}.iad-direction-objective{padding-bottom:20px;border-bottom:1px solid var(--iad-border)}.iad-detail-dialog.iad-direction-dialog h3{margin:0 0 12px}.iad-direction-body p{white-space:pre-line;overflow-wrap:anywhere;line-height:1.8}.iad-direction-text-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;padding:20px 0;border-bottom:1px solid var(--iad-border)}.iad-direction-text-grid>section+section{padding-top:20px;border-top:1px solid var(--iad-border)}.iad-direction-text-grid ul{margin:0;padding-left:18px;display:grid;gap:10px}.iad-direction-evidence{padding-top:20px}.iad-evidence-groups{display:grid;grid-template-columns:minmax(0,var(--iad-normal-width,3fr)) minmax(0,var(--iad-defect-width,5fr));gap:24px}.iad-evidence-group{min-width:0}.iad-evidence-group h4{display:flex;justify-content:space-between;gap:8px;margin:0 0 10px;font-size:.75rem;font-weight:500;color:var(--iad-muted)}.iad-evidence-thumbnails>div:first-child{display:grid;grid-template-columns:repeat(var(--iad-evidence-columns),minmax(0,1fr));gap:10px}.iad-direction-evidence-item{display:grid;gap:6px;text-align:left;min-width:0;padding:5px!important;border-color:var(--iad-border)!important}.iad-direction-evidence-item img{width:100%;height:104px;object-fit:contain;background:var(--iad-surface-muted)}.iad-direction-evidence-item strong{font-size:.75rem;font-weight:500}.iad-direction-evidence-item>span{font-size:.625rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.iad-direction-evidence-item[data-focused=true]{outline:2px solid var(--iad-primary);outline-offset:2px;border-color:var(--iad-primary)!important}.iad-direction-trace{margin-top:16px;padding-top:12px;border-top:1px solid var(--iad-border);overflow-wrap:anywhere}.iad-direction-trace summary{cursor:pointer;min-height:32px}.iad-direction-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;flex:none;padding:14px 28px;border-top:1px solid var(--iad-border)}.iad-direction-destination{display:flex;align-items:center;gap:12px;color:var(--iad-muted);font-size:.75rem}.iad-direction-destination select{width:112px}.iad-missing-evidence{overflow-wrap:anywhere;font-size:.75rem}.iad-missing-evidence code{display:block}
@media(max-width:1050px){.iad-evidence-groups{grid-template-columns:minmax(0,1fr)}.iad-evidence-thumbnails>div:first-child{grid-template-columns:repeat(5,minmax(0,1fr))}}



.iad-exploration-page, #exploration-page {
  --canvas:#f5f7fa;--surface:#fff;--surface-alt:#f9fafc;--border:#dbe2eb;--border2:#e6ebf1;
  --ink:#17233a;--sub:#64748b;--blue:#285ed6;--blue-light:#eaf0ff;--hover:#f0f4fb;
  --ok:#177b53;--ok-bg:#e7f5ed;--ng:#bf394a;--ng-bg:#fdecef;--unknown:#607087;--unknown-bg:#eff2f6;
  min-width: 0;
}

.exp-heading-actions{display:flex;align-items:center;gap:11px;min-width:0}
.exp-heading-actions select{width:min(350px,35vw);height:38px;text-overflow:ellipsis}
.exp-select{min-width:260px}
.exp-sync{display:flex;align-items:center;gap:13px;min-height:36px;font-size:12px;color:#6a7a91;margin:0 0 11px}
.exp-sync strong{color:#38506c;font-weight:500}.exp-sync .subtle-icon{margin-left:auto}
.exp-panel{border:1px solid var(--border);background:#fff;border-radius:6px;padding:21px 23px;margin:0 0 var(--iad-layout-gap)}
.exp-panel h2{font-size:16px;font-weight:650;margin:0}.exp-panel h3{font-size:13px;font-weight:600;margin:0}
.exp-panel-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:17px;min-height:26px}
.exp-lead{font-size:12px;color:#6c7b90;margin:6px 0 0}
.exp-btn-text{background:transparent;border:0;color:#2d5dcb;padding:0 4px;min-height:32px}
.exp-input{display:flex;flex-direction:column;gap:7px;color:#52637c;font-size:12px}
.exp-input input,.exp-input select{width:100%;height:38px;background:#fff}
.exp-input textarea{width:100%;resize:vertical;background:#fff;min-height:140px;max-height:470px;border:1px solid #aebdd2;border-radius:5px;padding:11px;color:#1b2b45;line-height:1.7;font:13px/1.7 system-ui,'Microsoft YaHei',sans-serif;outline:none}
.exp-input textarea:focus{border-color:var(--blue);outline:2px solid #b4c8ff}
.exp-config-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
.exp-steps{display:flex;align-items:center;gap:8px;color:#63748b;font-size:12px}
.exp-step{display:flex;align-items:center;gap:6px;white-space:nowrap}
.exp-step b{width:23px;height:23px;display:grid;place-items:center;border-radius:50%;font-size:11px;font-weight:650;border:1px solid #cdd7e6}
.exp-step.on{color:#2459c5;font-weight:650}.exp-step.on b{background:#285ed6;color:#fff;border-color:#285ed6}
.exp-step-line{width:29px;height:1px;background:#cbd5e5}
.exp-samples{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.exp-sample{border:1px solid #dce4ee;border-radius:6px;padding:16px;min-width:0;background:#fff}
.exp-sample-head{display:flex;align-items:end;justify-content:space-between;gap:14px}
.exp-sample-head strong{font-size:14px}.exp-sample-head span{font-size:12px;color:#6b7b90}
.exp-sample-tools{display:flex;align-items:end;gap:10px;margin:12px 0}.exp-sample-tools .exp-input{width:120px}
.exp-sample-tools .exp-input input{height:36px}
.exp-previews{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;min-height:102px;margin:16px 0 12px}
.exp-preview{min-width:0}.exp-preview img{display:block;width:100%;height:89px;object-fit:contain;background:#f0f4f9;border-radius:4px;border:1px solid #e5eaf1}
.exp-preview span{font-size:11px;color:#6b7b90;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;padding-top:4px}
.exp-preview.empty{min-height:0;grid-column:1/-1;border:1px dashed #dce4ef;background:#fafbfe;display:flex;align-items:center;justify-content:center;color:#8190a6;font-size:12px;height:100px}
.exp-prompt-head{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:end;gap:10px;margin-bottom:16px}
.exp-prompt-head .exp-input{max-width:520px}.exp-prompt-head .iad-button{align-self:end}
.exp-prompt-note{color:#64748b;font-size:12px;margin:8px 0 0}
.exp-summarybar{display:flex;align-items:center;gap:14px;justify-content:space-between;border-top:1px solid #e2e8f1;margin-top:22px;padding-top:18px}
.exp-brief{display:flex;align-items:center;gap:20px;flex-wrap:wrap;color:#53647f;font-size:12px}.exp-brief b{font-weight:650;color:#263a56}
.exp-actions{display:flex;align-items:center;gap:8px;flex:none}
.exp-alert{color:#ba3f46;font-size:12px;margin:9px 0 0}
.exp-empty{padding:62px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#fff;border:1px solid #dce4ee;border-radius:6px;text-align:center}
.exp-empty strong{font-size:16px;color:#26344d}.exp-empty p{font-size:13px;color:#7b8ba1;margin:0}
.exp-status{margin-bottom:17px;display:flex;justify-content:space-between;gap:15px;align-items:center}
.exp-state{font-weight:600;font-size:13px;color:#2b4d88}.exp-progress{height:5px;background:#e4eaf3;border-radius:4px;overflow:hidden;margin:12px 0}
.exp-progress>i{height:100%;width:35%;display:block;background:#3771df;animation:exp-slide 2s linear infinite}
@keyframes exp-slide{from{transform:translateX(-110%)}to{transform:translateX(300%)}}
.exp-phase-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:6px 0 0}
.exp-phase{display:flex;gap:8px;align-items:start;font-size:12px;color:#8190a6;min-width:0}.exp-phase b{display:grid;place-items:center;width:22px;height:22px;border:1px solid #ccd8e7;border-radius:50%;flex:none;font-size:11px}
.exp-phase.done{color:#16825e}.exp-phase.active{color:#2c5ecb;font-weight:600}.exp-phase.active b{background:#2b61d5;color:#fff;border-color:#2b61d5}
.exp-result-controls{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:0 0 14px}
.exp-result-controls select{min-width:230px}
.exp-table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
.exp-table thead{background:#f1f4f9;color:#172338}.exp-table th{font-size:13px;font-weight:600;text-align:left;padding:13px 16px;color:#172338}.exp-table td{border-top:1px solid #e5eaf1;padding:14px 16px;color:#172338;font-size:13px}.exp-table tr[data-action]:hover{background:#f7faff;cursor:pointer}.exp-table th:last-child,.exp-table td:last-child{text-align:right}
.exp-table .exp-row-title{font-weight:600;color:#172338}.exp-table .exp-row-info{display:block;font-size:13px;color:#172338;padding-top:4px}
.exp-jobs-filters{display:flex;align-items:center;gap:10px;margin-bottom:13px}.exp-jobs-filters select{width:158px}
.exp-pill{display:inline-block;border-radius:4px;padding:3px 8px;color:#5d708d;background:#eef2f7;font-size:12px}.exp-pill.ok{background:#e8f5ee;color:#177b53}.exp-pill.running{background:#e9f0ff;color:#285ed6}.exp-pill.fail{background:#ffedf0;color:#b23c43}
.exp-detail-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:22px}
.exp-evidence{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 0}
.exp-evidence img{width:100%;height:120px;object-fit:contain;background:#f0f4f9;border-radius:4px}
.exp-detail-field{padding:8px 0;border-bottom:1px solid #e8edf3;font-size:13px}.exp-detail-field span{display:block;font-size:12px;color:#76869a;margin-bottom:5px}
.exp-inline-warning{margin:0 0 10px;font-size:12px;color:#a64e3e}
@media(max-width:1120px){.exp-samples{gap:12px}.exp-preview img{height:72px}}
@media(max-width:850px){.exp-heading-actions select{width:220px}.exp-samples{grid-template-columns:1fr}.exp-prompt-head{grid-template-columns:1fr auto}.exp-prompt-head .exp-input{grid-column:1/-1;max-width:none}.exp-phase-grid{grid-template-columns:repeat(2,1fr)}.exp-detail-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.exp-progress>i{animation:none}}

.exp-sample-body{min-width:0}
.exp-sample-toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:0 0 14px;flex-wrap:wrap}
.exp-sample-toolbar p{margin:0;color:#75869c;font-size:12px}
.exp-sample-toolbar .exp-actions{gap:10px}
.exp-previews.exp-previews-wide{grid-template-columns:repeat(6,minmax(0,1fr));gap:11px;min-height:148px;margin:0 0 3px}
.exp-previews-wide .exp-preview img{height:110px}
.exp-previews-wide .exp-preview.empty{height:156px}
.exp-sample-context{color:#75859c;font-size:12px;padding-bottom:12px}
.exp-samples.exp-samples-tabs{display:block}
@media(max-width:1200px){.exp-previews.exp-previews-wide{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(max-width:970px){.exp-previews.exp-previews-wide{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:640px){.exp-scope>.exp-input:first-child,.exp-child-wrap{width:100%}.exp-previews.exp-previews-wide{grid-template-columns:repeat(2,minmax(0,1fr))}}


.exp-sample-toolbar{justify-content:flex-end}
.exp-clear-icon svg{pointer-events:none}


.exp-tab-header{display:flex;align-items:stretch;justify-content:space-between;gap:16px;border-bottom:1px solid #dfe7f0;margin-bottom:15px}
.exp-tab-header .iad-tabs{margin:0;min-width:0}
.exp-tab-header .exp-clear-icon{align-self:center;margin:0 1px 2px 0}
.exp-previews.exp-previews-wide{margin:0 0 3px;min-height:148px}
.exp-previews-wide .exp-preview.add-tile{height:145px;min-height:0}
.exp-add-image{width:100%;height:100%;min-height:145px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#fafbfe;border:1px dashed #c8d5e6;border-radius:5px;color:#6b7f9b;font:inherit;font-size:13px;cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.exp-add-image svg{width:25px;height:25px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.exp-add-image:hover:not(:disabled){background:#f1f6ff;color:#2d61cb;border-color:#81a7ec}
.exp-add-image:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.exp-add-image:disabled{cursor:not-allowed;opacity:.5}
.exp-add-image.exp-add-empty{grid-column:1/-1;height:160px}
.exp-add-image.exp-add-empty svg{width:23px;height:23px}


.exp-job-table-wrap{overflow-x:auto}
.exp-job-table{width:100%;border-collapse:collapse;table-layout:fixed}
.exp-job-table thead{background:#f2f5fa}
.exp-job-table th{text-align:left;color:#172338;font-weight:600;font-size:13px;border-bottom:1px solid #dfe6f0;white-space:nowrap}
.exp-job-table td{border-bottom:1px solid #e5eaf1;font-size:13px;color:#172338;vertical-align:middle}
.exp-job-table:not(.iad-job-table-grid) th{padding:12px 18px}
.exp-job-table:not(.iad-job-table-grid) td{padding:16px 18px}
.exp-job-table tbody tr:last-child td{border-bottom:none}
.exp-job-table tbody tr[data-action]{cursor:pointer}
.exp-job-table tbody tr[data-action]:hover{background:#f5f8ff}
.exp-job-table tbody tr[data-action]:focus-visible{outline:2px solid #85aaff;outline-offset:-2px}
.exp-job-table .exp-row-title{display:block;overflow-wrap:anywhere}
.exp-job-table th:nth-child(1){width:24%}.exp-job-table th:nth-child(2){width:13%}.exp-job-table th:nth-child(3){width:25%}.exp-job-table th:nth-child(4){width:18%}.exp-job-table th:nth-child(5){width:10%}
.exp-job-table .exp-pill{font-size:12px;border-radius:4px;font-weight:500}
.exp-pill.pending{color:#8e6d24;background:#fff5df}
@media(max-width:980px){.exp-job-table{min-width:780px}}


.exp-unified-layout{display:flex;flex-direction:column;gap:var(--iad-layout-gap);min-width:0}
.exp-unified-layout>:is(.exp-panel,.iad-job-list){width:100%;min-width:0;box-sizing:border-box;margin:0}
.exp-selected-result{padding:0}
.exp-result-content{--exp-result-inset:22px;padding:18px var(--exp-result-inset) 24px}
.exp-result-summary{font-size:13px;color:#475a73;line-height:1.75;margin:0 0 22px;max-width:none}
.exp-result-section-head{display:flex;align-items:center;justify-content:space-between;margin:0 0 13px}
.exp-result-section-head h3{font-size:14px;margin:0;font-weight:650}
.exp-result-count{font-size:12px;color:#75869b}
.exp-direction-table th:nth-child(1){width:66%}
.exp-direction-table th:nth-child(2){width:22%}
.exp-direction-table td{vertical-align:middle}
.exp-direction-table tbody tr{cursor:pointer}
.exp-direction-table tbody tr:hover{background:#f6f9ff}
.exp-direction-table tbody tr:focus-visible{outline:2px solid #2a62d8;outline-offset:-2px}
.exp-limitations{margin-top:24px;border-top:1px solid #e2e8f0;padding-top:19px}
.exp-limitations ol{margin:0;padding-left:20px;display:grid;gap:8px;color:#465670;font-size:13px;line-height:1.75}
.exp-limitations ol li{padding-left:3px}
.exp-result-neutral{font-size:12px;color:#70819a;margin-top:18px}
.exp-error-message{color:#a23043;background:#fff6f7;border:1px solid #f3d7dc;padding:13px 15px;border-radius:5px;font-size:13px;line-height:1.6}
.exp-unified-empty{min-height:165px!important}
@media(max-width:900px){.exp-result-content{--exp-result-inset:17px}.exp-direction-table th:nth-child(1){width:auto}}

.exp-prompt-action-col{width:128px;text-align:right!important}
.exp-prompt-link{border:0;background:transparent;color:#245bcc;font:inherit;font-size:12px;padding:6px 5px;cursor:pointer;border-radius:5px;white-space:nowrap}
.exp-prompt-link:hover{background:#edf3ff}
.exp-prompt-link:focus-visible{outline:2px solid #2d65da;outline-offset:1px}


@keyframes exp-drawer-enter{from{transform:translateX(24px);opacity:.7}to{transform:translateX(0);opacity:1}}




@media(max-width:760px){.exp-prompt-action-col{width:110px}}


.exp-direction-table th:nth-child(1){width:auto!important}
.exp-direction-table th:nth-child(2){width:175px!important}
.exp-direction-table th:nth-child(3){width:96px!important}
.exp-direction-table th:nth-child(4){width:135px!important;text-align:right}
.exp-direction-table td:last-child{text-align:right}
.exp-direction-table th:last-child{width:94px!important}
.exp-direction-meta{display:flex;gap:13px;align-items:center;flex-wrap:wrap;padding:12px 0 16px;font-size:12px;color:#64748b}
.exp-direction-meta strong{font-weight:550;color:#415675}
.exp-direction-footer-label{color:#697b95;font-size:12px}
.exp-direction-knowledge-select{width:120px!important;min-height:35px}
.exp-direction-foot-spacer{flex:1}
.exp-direction-detail-ids{border-top:1px solid #e1e7f0;padding:12px 0 18px}
.exp-direction-detail-ids summary{font-size:12px;color:#566b86;cursor:pointer}
.exp-direction-detail-ids dl{display:grid;grid-template-columns:85px minmax(0,1fr);gap:12px 14px;font-size:12px;margin:15px 0 0}
.exp-direction-detail-ids dt{color:#70819a}.exp-direction-detail-ids dd{margin:0;color:#34445d;overflow-wrap:anywhere}
.exp-evidence-lightbox{position:fixed;inset:0;z-index:700;background:#1c2534eF;display:flex;align-items:center;justify-content:center}
.exp-evidence-lightbox[hidden]{display:none}
.exp-evidence-lightbox img{display:block;max-width:calc(100vw - 150px);max-height:calc(100dvh - 68px);object-fit:contain}
.exp-evidence-lightbox button{position:absolute;display:grid;place-items:center;width:42px}
.exp-evidence-lightbox .close{right:20px;top:16px}.exp-evidence-lightbox .prev{left:20px;top:50%;transform:translateY(-50%)}.exp-evidence-lightbox .next{right:20px;top:50%;transform:translateY(-50%)}
.exp-evidence-lightbox .caption{position:absolute;bottom:14px;color:#dde8f5;font-size:12px;max-width:75vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}




.exp-direction-table th:nth-child(4){width:105px!important}
.exp-direction-table .exp-direction-action .exp-direction-link{font-size:13px;min-height:30px;padding:3px 8px;border:0;background:transparent;color:#245bcc;border-radius:5px;cursor:pointer}
.exp-direction-table .exp-direction-action .exp-direction-link:hover{background:#edf3ff}
.exp-prompt-action-col{width:110px!important;min-width:100px;text-align:right!important}
.exp-job-icon-actions{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.exp-direction-action{ text-align:right; }
.exp-direction-action .exp-direction-view-icon{margin-left:auto;color:#61738e;}
.exp-direction-action .exp-direction-view-icon:hover{background:#eaf1ff;color:#255ac7;}
.exp-delete-text{font-size:14px;line-height:1.7;margin:0 0 9px}



.exp-direction-action{white-space:nowrap!important}
.exp-direction-action .exp-row-icon{vertical-align:middle;margin-left:5px}
.exp-direction-table th:last-child{width:112px!important}

.exp-result-content > .exp-job-table-wrap{
  margin-inline:calc(-1 * var(--exp-result-inset));
  width:calc(100% + var(--exp-result-inset) + var(--exp-result-inset));
  max-width:none;
}
.exp-unified-layout .exp-selected-result .exp-direction-table th{
  padding:12px 18px;
}
.exp-unified-layout .exp-selected-result .exp-direction-table td{
  padding:16px 18px;
}

/* \u7ED3\u679C\u9762\u677F\u53CA\u5019\u9009\u65B9\u5411\u5B8C\u6574\u53C2\u4E0E\u9875\u9762\u6EDA\u52A8\uFF0C\u4E0D\u4FDD\u7559\u4EFB\u4F55\u5185\u90E8\u7EB5\u5411\u6EDA\u52A8\u9AD8\u5EA6\u9650\u5236\u3002 */
.exp-unified-layout .exp-selected-result:not(.exp-empty-result){
  max-height:none!important;height:auto!important;overflow:visible!important;
  overscroll-behavior:auto;
}
.exp-result-content > .exp-job-table-wrap{max-height:none!important;overflow-y:visible;overflow-x:auto}
.exp-result-empty-message{color:#6c7d93;font-size:13px;line-height:1.75;padding:8px 0 16px}
.exp-empty-result{min-height:165px!important}

.exp-selected-result .exp-direction-table{width:100%!important;table-layout:fixed!important;min-width:850px!important}
.exp-selected-result .exp-direction-table th:nth-child(1){width:25%!important}
.exp-selected-result .exp-direction-table th:nth-child(2){width:39%!important}
.exp-selected-result .exp-direction-table th:nth-child(3){width:14%!important}
.exp-selected-result .exp-direction-table th:nth-child(4){width:10%!important}
.exp-selected-result .exp-direction-table th:nth-child(5){width:12%!important;text-align:right!important}
.exp-selected-result .exp-direction-table td{font-weight:400!important;color:var(--iba-v50-ink, #172338)!important;vertical-align:middle!important}
.exp-selected-result .exp-direction-table td.exp-direction-description{white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.6!important}
.exp-selected-result .exp-direction-table td.exp-direction-name{white-space:normal!important;overflow-wrap:anywhere!important}
.exp-selected-result .exp-direction-table th:nth-child(5),.exp-selected-result .exp-direction-table td:last-child{white-space:nowrap!important;text-align:right!important}
.exp-result-section-head:empty{display:none!important}



`;var mg=`.iad-detail-dialog,.iad-floating-menu-panel{overflow-wrap:anywhere;font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.iad-panel{min-width:0;padding:24px;border:1px solid var(--iad-border);border-radius:var(--iad-radius);background:var(--iad-surface)}.iad-panel>h3:first-child{margin-top:0}
.iad-workbench {container:workbench / inline-size;height:100%;box-sizing:border-box;overflow:auto;scrollbar-gutter:stable;min-width:0;padding:var(--iad-page-padding);color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
:is(.iad-workbench,.iad-detail-dialog,.iad-floating-menu-panel) * {box-sizing:border-box;}
.iad-plain-empty{margin:0;padding:24px;color:var(--iad-text);font-size:var(--iad-font-size);line-height:1.6;font-weight:400;text-align:left;background:var(--iad-surface)}
.iad-workbench .iad-result-empty{margin:0;padding:28px 16px;min-height:88px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;line-height:1.5;font-weight:400;color:#65758c}
.iad-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.iad-field select {width:100%;}
.iad-workbench h1 {font-size:var(--iad-title-size);line-height:1.285714;margin:0;font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) h2 {font-size:var(--iad-section-size);line-height:1.4;margin:0 0 var(--iad-space-4);font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) h3 {font-size:var(--iad-group-size);line-height:1.5;margin:var(--iad-space-6) 0 var(--iad-space-2);font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) p {margin:0;}:is(.iad-workbench,.iad-detail-dialog) p+p {margin-top:12px;}
.iad-header,.iad-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.iad-action-end {margin-inline-start:auto;flex:none;}
.iad-header {flex-shrink:0;justify-content:space-between;align-items:end;margin-bottom:var(--iad-section-gap);}.iad-header-actions{display:flex;align-items:center;gap:var(--iad-space-3);min-width:0;flex-wrap:wrap}.iad-header-actions select{max-width:min(100%,24rem)}



.iad-type-switch {display:inline-flex;gap:3px;padding:3px;background:var(--iad-surface-muted);border-radius:var(--iad-radius);}
.iad-type-switch button {min-width:64px;}
.iad-section-layout {display:grid;grid-template-columns:180px minmax(0,1fr);gap:32px;padding:28px 0;border-bottom:1px solid var(--iad-border);min-width:0;}
.iad-section-layout:first-child {padding-top:0;}.iad-section-layout:last-of-type {padding-bottom:0;border-bottom:0;}
.iad-section-layout>div {min-width:0;}.iad-section-layout h3 {margin:0;}.iad-section-layout .iad-field:first-child {margin-top:0;}
@container workbench (max-width:1180px){.iad-section-layout{grid-template-columns:150px minmax(0,1fr);gap:24px}}
@container workbench (max-width:900px){.iad-section-layout{grid-template-columns:minmax(0,1fr);gap:20px}}

/* IBA Unified Two-Tier Dataset Hierarchy Scope Selector */

`;var hg=`.iad-main {display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start;}
.iad-audit-sample:not(.iad-inline-dialog) .iad-inspector{position:static;padding:0}.iad-audit-sample:not(.iad-inline-dialog) .iad-inspector>h2{display:none}
.iad-main[data-compact=true]{grid-template-columns:minmax(0,1fr)}
.iad-gallery {min-width:0;color:var(--iad-text);background:transparent;border:0;border-radius:var(--iad-radius);padding:0;}.iad-filters {display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-bottom:20px;background:transparent;padding:0;}
.iad-filter {font-size:12px;color:var(--iad-muted);display:flex;flex-direction:column;gap:8px;min-width:0;max-width:100%;}
.iad-filter select {font-size:14px;width:150px;max-width:100%;color:var(--iad-text);}
.iad-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,184px),1fr));gap:24px 16px;}
.iad-sample-item {position:relative;min-width:0;}
.iad-workbench button.iad-sample {display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;width:100%;text-align:left;overflow:hidden;}
.iad-sample>strong {display:block;margin:0;padding:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:20px;font-weight:500;}
.iad-thumb {position:relative;width:100%;aspect-ratio:4/3;flex:none;overflow:hidden;background:var(--iad-surface-muted);}.iad-thumb img {position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;}
.iad-sample-label {font-size:.75rem;line-height:44px;padding:0 8px;color:var(--iad-muted);}
.iad-workbench .iad-status-trigger {position:absolute;right:4px;bottom:2px;z-index:1;display:flex;align-items:center;justify-content:end;gap:6px;min-height:44px;padding:4px 8px;border:0;background:transparent;font-size:.75rem;color:var(--iad-muted);}
.iad-status-mark {width:6px;height:6px;border-radius:50%;background:currentColor;flex:none;}
.iad-reference {padding:2px 5px;color:var(--iad-on-viewer);border-radius:4px;font-size:12px;}
.iad-reference {position:absolute;left:6px;bottom:6px;background:var(--iad-success-badge);}
.iad-inspector {background:var(--iad-surface);border:0;border-radius:var(--iad-radius);padding:20px;min-width:0;position:sticky;top:0;}
.iad-image-button {display:block;width:100%;padding:0!important;border:0!important;background:var(--iad-surface-muted)!important;}
.iad-image-frame {position:relative;width:100%;line-height:0;}.iad-image-frame img {display:block;width:100%;height:auto;}
.iad-inspector-filename{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.iad-observation-summary{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.iad-inspector>h3{margin-top:16px}.iad-inspector-basis{margin-top:12px!important;overflow-wrap:anywhere}.iad-audit-details{margin-top:20px}.iad-audit-details>summary{cursor:pointer;min-height:40px;color:var(--iad-muted)}
.iad-inspector>.iad-media-load .iad-image-button {height:156px;margin:16px 0;display:flex;justify-content:center;align-items:center;overflow:hidden}.iad-inspector>.iad-media-load .iad-image-frame {width:auto;max-width:100%;height:100%}.iad-inspector>.iad-media-load .iad-image-frame img {width:auto;max-width:100%;height:100%;object-fit:contain;}
.iad-image-frame svg,.iad-finding-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon,.iad-finding-layer rect {fill:none;stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:var(--iad-on-viewer);stroke:var(--iad-viewer);stroke-width:calc(4px / var(--iad-view-scale,1));paint-order:stroke;stroke-linejoin:round;font-size:calc(14px / var(--iad-view-scale,1));}
.iad-image-frame .iad-annotation-mask {opacity:.28;}
.iad-image-frame .iad-annotation-mask rect {fill:var(--iad-warning);stroke:none;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:var(--iad-muted);}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench code {overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:var(--iad-muted);}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-row>.iad-field {flex:1 1 280px;min-width:0;}
.iad-error {color:var(--iad-danger);background:color-mix(in srgb,var(--iad-danger) 12%,var(--iad-surface));padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-muted {color:var(--iad-muted);font-size:.75rem;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-review-records {min-width:0;padding:18px;background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-table-scroll {max-width:100%;overflow:auto;scroll-margin-block:24px;}.iad-review-records table {width:100%;min-width:620px;border-collapse:collapse;text-align:left;font-size:13px;}
.iad-review-records .iad-table-scroll {max-height:min(60dvh,480px);}
.iad-review-records caption {text-align:left;font-weight:600;margin:12px 0;}.iad-review-records th,.iad-review-records td {padding:12px;vertical-align:top;overflow-wrap:anywhere;max-width:240px;}
.iad-review-records thead,.iad-review-records tr[data-selected=true] {background:var(--iad-surface-muted);}.iad-review-records time {font-size:12px;color:var(--iad-muted);}
.iad-job-table {min-width:0;}.iad-job-table>.iad-field {max-width:240px;}.iad-identifier {display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-resource-table {width:100%;border-collapse:collapse;text-align:left;font-size:.875rem;}
.iad-resource-table th,.iad-resource-table td {padding:8px 16px;height:56px;border-bottom:1px solid var(--iad-border);vertical-align:middle;}
.iad-resource-table th {height:44px;background:var(--iad-surface-muted);font-weight:500;color:var(--iad-muted);white-space:nowrap;}
:is(th,td).iad-number {text-align:right;font-variant-numeric:tabular-nums;}
.iad-resource-table tr[data-selected=true] {background:var(--iad-hover);}
.iad-rule {margin-top:20px;}.iad-reference-grid {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.iad-reference-grid img {width:90px;height:68px;object-fit:contain;background:var(--iad-surface-muted);border-radius:5px;}
.iad-reference-grid small {display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
`;var xg=`
.iad-job-list{min-width:0;overflow:hidden;padding:0;background:var(--iad-surface);border:1px solid var(--iad-panel-border);border-radius:6px;margin-bottom:var(--iad-layout-gap);font-size:var(--iad-font-size)}
.iad-job-list>nav.iad-pagination{margin:0;padding:11px 18px;border-top:1px solid var(--iad-border)}
.iad-job-filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.iad-job-list .iad-jobs-table{width:100%;min-width:1120px;table-layout:fixed;border-collapse:collapse;font-size:var(--iad-font-size);color:var(--iad-text)}
.iad-jobs-table th{text-align:left;font-weight:600;white-space:nowrap}
.iad-jobs-table td{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-top:1px solid var(--iad-border)}
.iad-jobs-table tr[aria-selected=true]{background:var(--iad-surface-muted)}
.iad-jobs-table tbody tr{cursor:pointer}.iad-jobs-table tbody tr:hover{background:var(--iad-hover)}.iad-jobs-table tbody tr:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}
.iad-jobs-table th:last-child{text-align:right}.iad-jobs-table td:is(:nth-child(4),:nth-child(6)){font-variant-numeric:tabular-nums}
.iad-job-col-id{width:27%}.iad-job-col-status{width:10%}.iad-job-col-dataset{width:17%}.iad-job-col-progress{width:9%}
.iad-job-col-submitted{width:16%}.iad-job-col-elapsed{width:8%}.iad-job-col-actions{width:156px}
.iad-job-actions{display:flex;gap:4px;align-items:center;justify-content:flex-end}
.iad-audit-statistics{padding:20px 24px}.iad-audit-statistics dl{display:flex;gap:24px;flex-wrap:wrap;margin:0 0 20px}.iad-audit-statistics dt{color:var(--iad-muted)}.iad-audit-statistics dd{margin:8px 0;font-size:24px;font-variant-numeric:tabular-nums}
.iad-audit-statistics table{width:100%;border-collapse:collapse}.iad-audit-statistics :is(th,td){padding:10px 16px;text-align:left}
.iad-job-badge{display:inline-block;border-radius:4px;padding:3px 8px;color:#8e6d24;background:#fff5df;font-size:12px;font-weight:500}
.iad-job-badge:is([data-status=COMPLETED],[data-status=PARTIAL]){background:#e8f5ee;color:#177b53}
.iad-job-badge[data-status=RUNNING]{background:#e9f0ff;color:#285ed6}
.iad-job-badge:is([data-status=FAILED],[data-status=CANCELLED],[data-status=INTERRUPTED]){background:#ffedf0;color:#b23c43}
.iad-job-panel{min-width:0}.iad-job-panel>h2{margin-top:26px}
.iad-job-drawer-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:22px 24px 28px;color:var(--iad-text);font-size:var(--iad-font-size)}
.iad-job-statusline{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.iad-job-statusline>strong{font-size:15px;font-weight:650}
.iad-job-pill{display:inline-flex;align-items:center;padding:4px 10px;border:1px solid #d7e0eb;background:#f5f7fa;border-radius:var(--iad-radius);font-size:12px;font-weight:500}
.iad-job-pill[data-status=RUNNING]{border-color:#aec4ea;background:#edf3fd}
.iad-job-pill:is([data-status=FAILED],[data-status=PARTIAL],[data-status=INTERRUPTED]){border-color:#e6bfc5;background:#fff4f5}
.iad-job-drawer-body .iad-job-meta{display:grid;grid-template-columns:100px minmax(0,1fr);column-gap:14px;row-gap:10px;margin:0 0 22px}
.iad-job-drawer-body .iad-job-meta dt{color:var(--iad-muted)}.iad-job-drawer-body .iad-job-meta dd{margin:0;overflow-wrap:anywhere}
.iad-job-status-section{padding-top:20px;margin-top:18px;border-top:1px solid var(--iad-border)}
.iad-job-status-section h3{font-size:14px;font-weight:650;margin:0 0 14px}
.iad-job-stage-list{display:flex;flex-direction:column;gap:0;position:relative}
.iad-job-stage{display:grid;grid-template-columns:26px minmax(0,1fr) auto;column-gap:10px;min-height:48px;position:relative;color:var(--iad-muted)}
.iad-job-stage-time{font-variant-numeric:tabular-nums;white-space:nowrap;padding-top:3px;text-align:right}
.iad-job-stage:not(:last-child)::before{content:'';position:absolute;left:11px;top:25px;bottom:1px;width:1px;background:var(--iad-border)}
.iad-job-dot{display:grid;place-items:center;box-sizing:border-box;width:24px;height:24px;border-radius:50%;border:1px solid #ced8e3;background:var(--iad-surface);font-size:12px;color:#63758d;z-index:1}
.iad-job-stage[data-state=done] .iad-job-dot{background:#f2f5f9;border-color:#9baabd;color:var(--iad-text)}
.iad-job-stage[data-state=current] .iad-job-dot{border-color:#2b60c6;background:#ecf3ff;color:#244ca9}
.iad-job-stage[data-state=error] .iad-job-dot{border-color:#b35f68;background:#fff1f2;color:#912c36}
.iad-job-stage strong{display:block;font-weight:500;color:var(--iad-text);padding-top:3px}
.iad-job-stage small{display:block;font-size:12px;color:var(--iad-muted);margin-top:4px}
.iad-job-error{background:#faf5f5;border:1px solid #e7cfd0;border-radius:var(--iad-radius);padding:14px 15px;line-height:1.7;overflow-wrap:anywhere}
.iad-job-error+.iad-job-error{margin-top:10px}.iad-job-error strong{display:block;font-size:var(--iad-font-size);margin-bottom:5px}.iad-job-error p{margin:0}.iad-job-error code{display:block;overflow-wrap:anywhere}
.iad-job-note{font-size:12px;color:var(--iad-muted);line-height:1.65;margin:12px 0 0}
.iad-job-drawer-footer{border-top:1px solid var(--iad-border);display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;padding:13px 24px;flex:none}
.iad-job-drawer-footer p{flex-basis:100%;margin:0}
@media(max-width:680px){.iad-job-drawer-body{padding:18px 16px}.iad-job-drawer-footer{padding:12px 16px}}
`;var vg=`.iad-viewer-hint{margin:0;padding:8px 20px;flex:none;border-top:1px solid var(--iad-control-border);color:color-mix(in srgb,var(--iad-on-viewer) 75%,var(--iad-viewer));font-size:.75rem;background:var(--iad-viewer)}.iad-viewer-zoom{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.iad-viewer-evidence-group h4{font-size:.75rem;color:var(--iad-muted);font-weight:500;margin:16px 0 8px}.iad-viewer-heading{flex:1;min-width:160px;overflow:hidden}.iad-viewer-heading strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iad-viewer-heading small{display:block;margin-top:4px;font-size:.75rem;color:var(--iad-muted)}
.iad-viewer-dialog .iad-lightbox{padding:0}.iad-lightbox>.iad-lightbox-toolbar{padding:12px 20px;gap:12px;border-bottom:1px solid var(--iad-control-border);background:var(--iad-surface);color:var(--iad-text)}.iad-lightbox>.iad-viewer-body{margin:0;gap:0}.iad-viewer-body.has-context{grid-template-columns:minmax(0,1fr) 288px}.iad-viewer-aux{min-width:0;min-height:0;overflow:auto}.iad-viewer-aux>.iad-inspection-panel{height:100%;border-radius:0}.iad-viewer-context{padding:24px 20px;background:var(--iad-surface);color:var(--iad-text);height:100%;border-left:1px solid var(--iad-control-border);overflow:auto}.iad-viewer-context h3{font-size:.875rem;margin:0 0 10px}.iad-viewer-context p{font-size:.75rem;line-height:1.8;overflow-wrap:anywhere;color:var(--iad-muted)}.iad-viewer-context section,.iad-viewer-context details{margin-top:20px;padding-top:20px;border-top:1px solid var(--iad-border)}.iad-viewer-context dl{font-size:.75rem;overflow-wrap:anywhere}.iad-viewer-context dd{margin-left:0}.iad-viewer-thumbnails{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0 20px}.iad-viewer-thumbnails button{display:grid;gap:5px;padding:3px;min-width:0;font-size:.6875rem}.iad-viewer-thumbnails img{width:100%;height:80px;object-fit:contain;background:var(--iad-surface-muted)}.iad-viewer-thumbnails button[aria-current=true]{outline:2px solid var(--iad-primary);outline-offset:1px;background:var(--iad-hover)}

.iad-lightbox {position:fixed;inset:0;z-index:10000;background:var(--iad-viewer);display:flex;flex-direction:column;padding:20px;}
.iad-lightbox-toolbar {display:flex;flex-wrap:wrap;gap:16px;align-items:center;flex-shrink:0;color:var(--iad-on-viewer);}.iad-lightbox-toolbar strong {flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-media-load {min-width:0;}.iad-media-error {display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px;background:var(--iad-surface);color:var(--iad-text);line-height:1.5;}
.iad-viewer-media {position:relative;display:flex;flex-direction:column;min-height:0;}
.iad-viewer-edge-nav{position:absolute;inset:0;z-index:5;display:flex;justify-content:space-between;align-items:center;pointer-events:none}
.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button{display:grid;place-items:center;width:80px;height:216px;flex:none;padding:0;border:0;border-radius:0;background:transparent;color:var(--iad-on-viewer);opacity:0;pointer-events:auto;transition:opacity 150ms ease}
.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button:is(:hover,:focus-visible){opacity:1}
.iad-viewer-edge-disc{display:grid;place-items:center;width:52px;height:52px;border-radius:50%;background:var(--iad-viewer-edge-fill);border:1px solid var(--iad-viewer-edge-border);box-shadow:0 2px 10px var(--iad-viewer-edge-shadow);transition:background 150ms ease}
.iad-viewer-edge-button:is(:hover,:focus-visible)>.iad-viewer-edge-disc{background:var(--iad-viewer-edge-hover);border-color:var(--iad-viewer-edge-hover-border)}
.iad-viewer-edge-button:disabled>.iad-viewer-edge-disc{opacity:.38}
.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}
@media(hover:none){.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button:not(:disabled){opacity:1}}
@media(prefers-reduced-motion:reduce){.iad-image-canvas .iad-viewer-edge-nav>button.iad-viewer-edge-button,.iad-viewer-edge-disc{transition:none}}
.iad-viewer-media>.iad-media-loading {position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:max-content;max-width:calc(100% - 32px);padding:12px 16px;border-radius:var(--iad-radius);background:var(--iad-viewer);color:var(--iad-on-viewer);line-height:1.5;pointer-events:none;}
.iad-viewer-media[aria-busy=true] .iad-viewer-world {visibility:hidden;}
.iad-viewer-media>.iad-media-error {position:absolute;left:0;right:0;bottom:0;z-index:1;}
.iad-viewer-viewport {position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;cursor:grab;user-select:none;}
.iad-viewer-viewport:active {cursor:grabbing;}
.iad-roi-hint {position:absolute;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;max-width:min(280px,calc(100% - 24px));padding:8px 12px;border-radius:6px;background:var(--iad-surface);color:var(--iad-text);font-size:13px;line-height:1.5;overflow-wrap:anywhere;cursor:default;}
.iad-viewer-body {display:grid;grid-template-columns:minmax(0,1fr);flex:1;min-height:0;margin-top:18px;gap:16px;}
.iad-viewer-body.has-inspection:not(.has-context) {grid-template-columns:minmax(0,1fr) 340px;}
.iad-inspection-panel {padding:16px;min-width:0;overflow:auto;background:var(--iad-surface);color:var(--iad-text);border-radius:8px;}
.iad-inspection-panel img {display:block;width:100%;max-height:220px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-roi-list {display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}
.iad-roi-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;}
.iad-roi-layer rect {fill:none;stroke:var(--iad-on-viewer);stroke-width:calc(1px / var(--iad-view-scale,1));stroke-dasharray:calc(5px / var(--iad-view-scale,1)) calc(4px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-roi-layer [data-locked=true] rect,.iad-roi-layer .is-hovered rect {stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));stroke-dasharray:none;}

.iad-viewer-world {position:absolute;left:50%;top:50%;transform-origin:center;}
.iad-viewer-world .iad-image-frame,.iad-viewer-world img {width:100%;height:100%;}
.iad-floating-menu {position:relative;}
.iad-floating-menu-panel {z-index:20;min-width:180px;padding:12px;overflow:auto;background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:8px;box-shadow:0 8px 24px var(--iad-border);}
.iad-floating-menu-panel label {display:flex;align-items:center;gap:9px;padding:8px 4px;color:var(--iad-text);white-space:normal;font-size:14px;}
.iad-floating-menu-panel label.iad-filter {align-items:stretch;}
.iad-floating-menu-panel select {width:100%;max-width:none;}
.iad-layer-menu {color:var(--iad-text);}
.iad-layer-menu summary {cursor:pointer;padding:8px 12px;border-radius:8px;background:var(--iad-surface);min-height:40px;}

`;var yg=`
.iad-form-fields{display:grid;gap:19px;align-content:start}
.iad-form-fields>.iad-field{margin:0;gap:8px}
.iad-form-fields>.iad-field>label{font-weight:600}
.iad-choice-group{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;border:0;padding:0;margin:0;min-width:0}
.iad-choice-group legend{font-size:var(--iad-font-size);font-weight:600;padding:0;margin-bottom:8px}
.iad-choice-group label{display:flex;align-items:center;gap:6px;min-height:49px;padding:10px 16px;border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);font-weight:400;cursor:pointer}
.iad-choice-group label:has(input:checked){border-color:var(--iad-primary);background:var(--iad-hover)}
.iad-choice-group label:has(input:disabled){opacity:.48;cursor:not-allowed}
.iad-path-input{display:flex;align-items:center;gap:9px;flex-wrap:nowrap}
.iad-path-input>input{flex:1;min-width:0}.iad-path-input>button{flex:none}

.iad-directory-list {display:grid;gap:var(--iad-space-2);list-style:none;padding:0;margin:var(--iad-space-4) 0;max-height:320px;overflow:auto;}
.iad-directory-list .iad-button {width:100%;justify-content:flex-start;}
.iad-prompt-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:var(--iad-font-size);line-height:1.7;color:var(--iad-text)}
.iad-info-group {background:var(--iad-surface-muted);padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:var(--iad-primary);}
.iad-multiselect {align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 12px;min-height:var(--iad-control-height);font-size:14px;}
.iad-floating-menu>summary {display:flex;align-items:center;justify-content:space-between;gap:12px;}
.iad-floating-menu summary::marker {content:"";}
.iad-floating-menu[open]>summary {border-color:var(--iad-primary);}
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:12px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-quality-report dt {color:var(--iad-muted);}
.iad-profile {padding:14px;background:var(--iad-surface-muted);border-radius:8px;overflow-wrap:anywhere;}
.iad-filter-summary {display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--iad-muted);font-size:13px;margin:8px 0;}
.iad-search {flex:1 1 180px;max-width:300px;}
.iad-search input {width:100%;}
.iad-source-controls {background:var(--iad-hover);border-radius:var(--iad-radius);padding:12px 16px;display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;}
.iad-source-check {position:absolute;right:8px;top:8px;z-index:2;display:flex;padding:5px;background:var(--iad-surface);border-radius:6px;cursor:pointer;}
.iad-source-check input {margin:0;}
.iad-dialog-header {display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:-16px;z-index:5;background:var(--iad-surface);padding:8px 0;margin-bottom:12px;}
.iad-dialog-header h2 {margin:0;}
.iad-review-options {display:flex;flex-wrap:wrap;gap:8px 16px;border:0;padding:0;margin:16px 0;}
.iad-review-options legend {margin-bottom:8px;}
.iad-review-options label {display:flex;align-items:center;gap:8px;min-height:40px;cursor:pointer;}
.iad-form-actions {display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:20px;}
.iad-section-header {display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.iad-section-header h2 {margin:0;}
.iad-config-bar {display:flex;align-items:end;gap:12px;flex-wrap:wrap;}
.iad-config-bar>.iad-field {flex:1 1 220px;margin:0;min-width:0;}
.iad-config-bar select {width:100%;}
.iad-config-bar>.iad-button[data-variant="primary"] {margin-left:auto;}

.iad-discovery-area {margin:12px 0;}.iad-discovery-area h3 {margin:0 0 8px;}

.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:6px;padding:16px;}
.iad-detail-dialog.iad-inline-dialog {position:sticky;inset:auto;top:0;width:100%;max-width:none;max-height:none;margin:0;padding:0;overflow:visible;background:transparent;}.iad-inline-dialog .iad-inspector{position:static}
.iad-detail-dialog.iad-drawer {width:min(560px,100%);max-width:100%;height:100dvh;max-height:100dvh;margin:0 0 0 auto;border-radius:0;padding:0;overflow:hidden;display:flex;flex-direction:column;}.iad-drawer .iad-config-bar {padding:24px;overflow:auto;display:grid;gap:16px;}.iad-drawer .iad-config-bar>.iad-field {margin:0;}.iad-drawer .iad-job-panel {min-width:0;}
.iad-detail-dialog.iad-viewer-dialog {width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;background:var(--iad-viewer);overflow:hidden;}
.iad-detail-dialog::backdrop {background:var(--iad-modal-backdrop);}
.iad-detail-dialog>.iad-row {margin-bottom:16px;}
.iad-detail-dialog .iad-inspector {border:0;box-shadow:none;}
.iad-browse {min-width:0;}

@container workbench (max-width:959px){.iad-workbench{--iad-page-padding:var(--iad-space-6)}}

@media(prefers-reduced-motion:reduce) {.iad-workbench * {scroll-behavior:auto;transition:none;animation:none;}}

.iad-knowledge-content>p,.iad-knowledge-content [data-field] {overflow-wrap:anywhere;}

`;var bg=`.iad-workbench[data-page=industrial-review]:has(.iad-review-focused) {display:flex;flex-direction:column;overflow:auto;}
.iad-workbench[data-page=industrial-review]:has(.iad-review-focused)>.iad-tab-panel {display:flex;flex-direction:column;flex:1;min-height:min-content;}
.iad-focused-inspector {display:flex;flex-direction:column;flex:1;min-height:min-content;padding:0;background:transparent;}
.iad-review-focused {display:flex;flex-direction:column;flex:1;min-height:0;gap:16px;}
.iad-review-focused>.iad-filters {margin:0;flex:none;background:transparent;padding:0;}
.iad-review-columns {display:grid;grid-template-columns:180px minmax(0,1fr) 300px;gap:16px;flex:1;min-height:20rem;}
.iad-review-columns>aside,.iad-review-center {min-width:0;min-height:0;}.iad-review-columns>aside {contain:size;}
.iad-review-center {display:flex;flex-direction:column;gap:12px;}
.iad-review-information {max-height:40%;overflow:auto;background:var(--iad-surface);padding:12px;border-radius:var(--iad-radius);flex:none;}
.iad-review-information>summary {cursor:pointer;min-height:24px;}
.iad-review-queue-slot {overflow:auto;}
.iad-review-queue {padding:0;background:transparent;}
.iad-review-queue .iad-grid {display:flex;flex-direction:column;gap:8px;}
.iad-review-queue button.iad-sample {display:grid;grid-template-columns:40px minmax(0,1fr);gap:0 8px;}
.iad-review-queue .iad-thumb {grid-row:1/3;align-self:center;}
.iad-review-queue .iad-sample>strong {padding:0;line-height:22px;}
.iad-review-queue .iad-sample-label {padding:0;line-height:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.iad-review-queue .iad-pagination {flex-wrap:wrap;justify-content:center;}
.iad-review-decision-slot>.iad-decision {height:100%;}
.iad-decision {display:flex;flex-direction:column;min-height:0;background:var(--iad-surface);padding:16px;border-radius:var(--iad-radius);}
.iad-decision>h3 {margin:0 0 16px;}.iad-decision .iad-review-options{display:grid;grid-template-columns:minmax(0,1fr);gap:3px;margin:12px 0 20px}.iad-decision .iad-review-options label{min-height:36px;padding:7px 8px;border-radius:4px}.iad-decision .iad-review-options label:has(input:checked){background:var(--iad-hover);color:var(--iad-primary)}.iad-decision textarea{min-height:76px}.iad-review-records>.iad-field{max-width:360px;}
.iad-decision-scroll {min-height:0;overflow:auto;flex:1;padding:4px;scroll-padding:12px;}
.iad-review-submit {display:flex;flex-direction:column;gap:8px;padding-top:16px;flex:none;background:var(--iad-surface);}
.iad-review-submit .iad-error {margin:0;max-height:100px;overflow:auto;}
.iad-review-submit small {text-align:center;}
.iad-review-tools {display:none;gap:8px;flex:none;}
.iad-review-tools button {display:none;}
.iad-detail-dialog.iad-review-drawer {width:min(440px,100%);height:100dvh;max-height:100dvh;margin:0 0 0 auto;border-radius:0;flex-direction:column;}.iad-detail-dialog.iad-review-drawer[open]{display:flex;}
.iad-review-drawer>.iad-decision {flex:1;min-height:0;}
.iad-review-drawer .iad-review-queue {overflow:auto;}
.iad-embedded-canvas {position:relative;display:flex;flex-direction:column;flex:1;min-height:0;background:var(--iad-viewer);border-radius:var(--iad-radius);padding:12px;color:var(--iad-on-viewer);overflow:hidden;}
.iad-embedded-canvas .iad-lightbox-toolbar {gap:8px;}
.iad-embedded-canvas .iad-viewer-body {margin-top:12px;}
.iad-embedded-evidence {position:absolute;right:12px;bottom:12px;z-index:2;max-width:calc(100% - 24px);width:340px;color:var(--iad-text);background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-embedded-evidence>summary {cursor:pointer;padding:12px;min-height:44px;}
.iad-embedded-evidence .iad-inspection-panel {max-height:260px;}
@container workbench (max-width:1180px) {.iad-review-columns {grid-template-columns:minmax(0,1fr) 300px;}.iad-review-queue-slot {display:none;}.iad-review-tools {display:flex;}.iad-review-tools .iad-queue-trigger {display:block;}}
@container workbench (max-width:900px) {.iad-review-columns {grid-template-columns:minmax(0,1fr);}.iad-review-decision-slot {display:none;}.iad-review-tools .iad-decision-trigger {display:block;}}
.iad-conflict-workspace {display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;align-items:start;}
.iad-conflict-detail {display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;min-width:0;}.iad-conflict-detail>article,.iad-conflict-detail>aside {min-width:0;}
.iad-disposition-fields {border:0;min-width:0;margin:0;padding:0;}
@container workbench (max-width:1180px){.iad-conflict-detail {grid-template-columns:minmax(0,1fr);}.iad-conflict-workspace {grid-template-columns:220px minmax(0,1fr);}}
@container workbench (max-width:900px){.iad-conflict-workspace {grid-template-columns:minmax(0,1fr);}}

`;var wg=`
#knowledge-page .kb-create-fields{border:0;padding:0;margin:0;min-width:0;}
/* V49 Knowledge Mining Styles - Scoped to .kb-v45 and workbench */

:root {
  --iad-content-modal-gutter: var(--iba-dialog-gap, clamp(12px, 2.5vw, 32px));
  --iad-content-modal-radius: 8px;
  --iad-content-modal-width: 1380px;
  --iad-content-modal-height: 820px;
}

#knowledge-page, .iad-knowledge-page {
  --iad-content-modal-gutter: var(--iba-dialog-gap, clamp(12px, 2.5vw, 32px));
  --iad-content-modal-radius: 8px;
  --iad-content-modal-width: 1380px;
  --iad-content-modal-height: 820px;
  min-width: 0;
  --bg: #edf1f5;
  --side: #f7f9fc;
  --panel: #fff;
  --text: #172338;
  --secondary: #5d6f88;
  --muted: #8291a5;
  --border: #cfd9e6;
  --line: #e5ebf2;
  --blue: #285fc9;
  --blueweak: #e9effe;
  --green: #20804e;
  --greenweak: #e6f5eb;
  --amber: #976013;
  --amberweak: #fff4df;
  --red: #b04946;
  --redweak: #fff0ee;
  --radius: 6px;
}

:is(#knowledge-page, .iad-knowledge-page) .kb-v45,
.kb-v45 {
  --bg: #edf1f5;
  --side: #f7f9fc;
  --panel: #fff;
  --text: #172338;
  --secondary: #5d6f88;
  --muted: #8291a5;
  --border: #cfd9e6;
  --line: #e5ebf2;
  --blue: #285fc9;
  --blueweak: #e9effe;
  --green: #20804e;
  --greenweak: #e6f5eb;
  --amber: #976013;
  --amberweak: #fff4df;
  --red: #b04946;
  --redweak: #fff0ee;
  --radius: 6px;
}

.iad-knowledge-page {
  min-width: 0;
  width: 100%;
}

.kb-v45-main {
  min-width: 0;
  padding: 0;
}

.kb-v45 .actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Common Buttons & Form Controls in KB */

.kb-v45 .f {
  min-height: 38px;
  height: 38px;
  border: 1px solid #b7c5d9;
  border-radius: 5px;
  background: #fff;
  padding: 0 11px;
  font-size: 13px !important;
  color: #172338 !important;
}

.kb-v45 .f:hover:not(:disabled) {
  border-color: #94aad0;
}

.kb-v45 .f:focus-visible {
  outline: 2px solid #a9c1f5;
  outline-offset: 0;
  border-color: #285ed6;
}

.kb-v45 .f.wide {
  width: 100%;
}

.kb-v45 .f.select {
  padding-right: 24px;
}

.kb-v45 .f.textarea {
  min-height: 148px;
  height: auto;
  padding: 11px;
  max-height: 470px;
  line-height: 1.7;
  font-size: 13px !important;
  resize: vertical;
}

.kb-v45 .label {
  font-size: 13px !important;
  font-weight: 500;
  color: #172338 !important;
  display: block;
  margin: 0 0 7px;
}

/* Context scope bar */
.kb-v45 .kb-context-actions {
  display: flex;
  align-items: center;
  align-self: flex-end;
  flex: none;
}

.kb-v45 .context-info {
  display: none !important;
}

/* Panels */
.kb-v45 .panel {
  background: white;
  border: 1px solid #dbe2eb;
  border-radius: 6px;
  margin-bottom: var(--iad-layout-gap);
  overflow: hidden;
  box-shadow: none;
}

.kb-v45 .count {
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  margin-left: 10px;
}

.kb-v45 .filterset {
  display: flex;
  align-items: center;
  gap: 9px;
}

.kb-v45 .knowledge-entry-view:hover {
  color: #285fc9 !important;
  background: #edf2fa !important;
}

/* Status Badges */
.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  font-weight: 550;
}

.status.green {
  color: #177b53 !important;
  background: #e7f6eb;
}

.status.blue {
  color: #2458c7 !important;
  background: #e7efff;
}

.status.amber {
  color: #976013 !important;
  background: #fff2e0;
}

.status.red {
  color: #b23c43 !important;
  background: #fff0f0;
}

.status.gray {
  color: #526176 !important;
  background: #edf1f5;
}

.kb-v45 .tableempty {
  padding: 50px 18px;
  text-align: center;
  color: #172338 !important;
  font-size: 13px !important;
}

/* Lower Panel: Knowledge Entries */
.kb-v45 .knowledge-list {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
}

.kb-v45 .knowledge-head,
.kb-v45 .knowledge-row {
  display: grid;
  grid-template-columns: minmax(200px, 28%) minmax(290px, 1fr) 112px 90px !important;
  align-items: center;
  gap: 14px !important;
  min-width: 770px !important;
}

.kb-v45 .knowledge-entry-name,
.kb-v45 .knowledge-entry-description {
  display: block;
  font-weight: 400 !important;
  color: var(--iba-v50-ink, #172338) !important;
  line-height: 1.55;
  min-width: 0;
  overflow-wrap: anywhere;
}

.kb-v45 .knowledge-row .knowledge-entry-description {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  max-height: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.kb-v45 .jobtitle {
  font-weight: 400 !important;
  color: var(--iba-v50-ink, #172338) !important;
}

.kb-v45 .count.hide,
#jobs-count.hide,
#knowledge-count.hide {
  display: none !important;
}

.kb-v45 .knowledge-head {
  min-height: 43px;
  padding: 0 20px;
  background: #f1f4f9;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #dfe6f0;
}

.kb-v45 .knowledge-head > span:last-child {
  text-align: right;
}

.kb-v45 .knowledge-row {
  width: 100%;
  min-height: 74px;
  padding: 11px 20px;
  border: 0;
  border-bottom: 1px solid #e5eaf1;
  text-align: left;
  background: #fff;
  color: #172338 !important;
  cursor: pointer;
  font-size: 13px !important;
  border-radius: 0;
  font-family: inherit;
}

.kb-v45 .knowledge-row:hover {
  background: #f7faff;
}

.kb-v45 .knowledge-row:focus-visible {
  outline: 2px solid #8caef1;
  outline-offset: -2px;
  background: #f3f7ff;
}

.kb-v45 .knowledge-row .row-title {
  display: block;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1.5;
}

.kb-v45 .knowledge-row .row-desc {
  display: block;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.55;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-v45 .knowledge-row .col-evidence-count {
  text-align: left;
  color: #172338 !important;
  font-size: 13px !important;
  font-variant-numeric: tabular-nums;
}

.kb-v45 .knowledge-row .col-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  min-width: 0;
}

/* Blank states */
.kb-v45 .blank {
  padding: 57px 22px;
  text-align: center;
  color: #172338 !important;
}

.kb-v45 .demo-note {
  font-size: 13px !important;
  color: #172338 !important;
  font-weight: 400 !important;
  margin-top: 6px;
}

/* Overlays and Modals */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 27, 44, 0.42);
  display: none !important;
  z-index: 140;
  justify-content: center;
  align-items: center;
  padding: 18px;
}

.overlay.show {
  display: flex !important;
}


/* Detail Modal */


.detail-modal {
  width: min(var(--iad-content-modal-width), calc(100vw - 2 * var(--iad-content-modal-gutter))) !important;
  height: min(var(--iad-content-modal-height), calc(100dvh - 2 * var(--iad-content-modal-gutter))) !important;
  max-height: none !important;
  max-width: none !important;
  min-height: 0 !important;
  background: #fff;
  border-radius: var(--iad-content-modal-radius) !important;
  border: 1px solid #d9e2ed !important;
  box-shadow: 0 22px 65px rgba(20, 35, 63, 0.26) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-modal .modalheader {
  flex: none;
  padding: 17px 22px;
  border-bottom: 1px solid #e1e7ef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail-modal .modalheader h2 {
  font-size: 16px !important;
  font-weight: 650 !important;
  line-height: 1.5;
  margin: 0;
  color: #172338 !important;
}

.detail-modal .modalcontent {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 22px;
}

.detail-modal .modalfooter {
  flex: none;
  padding: 12px 22px;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #e5eaf2;
  display: flex;
}

.detail-section {
  padding: 0 0 17px;
  margin: 0 0 17px;
  border-bottom: 1px solid #e6ebf1;
}

.detail-section:last-child {
  border-bottom: 0;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-section h3 {
  font-size: 14px !important;
  font-weight: 650 !important;
  margin: 0 0 9px;
  color: #172338 !important;
}

.detail-section p {
  font-size: 13px !important;
  color: #172338 !important;
  line-height: 1.75;
  margin: 0;
  overflow-wrap: anywhere;
}

.detail-evidence-empty {
  padding: 15px;
  border: 1px dashed #dbe4ee;
  background: #f9fafc;
  border-radius: 5px;
  color: #172338 !important;
  font-size: 13px !important;
}

.knowledge-review-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin: 6px 0 17px;
}

.knowledge-review-options label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  font-weight: 400;
  color: #172338 !important;
  font-size: 13px !important;
}

.knowledge-review-options input {
  width: 17px;
  height: 17px;
  margin: 0;
  accent-color: #285ed6;
  cursor: pointer;
}

.detail-review textarea {
  min-height: 74px;
  max-height: 150px;
  width: 100%;
}










/* Create Overlay */
#create-overlay > .modal {
  width: min(var(--iad-content-modal-width), calc(100vw - 2 * var(--iad-content-modal-gutter))) !important;
  height: min(var(--iad-content-modal-height), calc(100dvh - 2 * var(--iad-content-modal-gutter))) !important;
  max-height: none !important;
  max-width: none !important;
  min-height: 0 !important;
  border-radius: var(--iad-content-modal-radius) !important;
  border: 1px solid #d9e2ed !important;
  background: #fff;
  box-shadow: 0 22px 65px rgba(20, 35, 63, 0.26) !important;
  display: flex;
  flex-direction: column;
}

#create-overlay .modalheader {
  padding: 19px 24px;
  border-bottom: 1px solid #e6ebf1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#create-overlay .modalheader h2 {
  font-size: 19px !important;
  margin: 0;
  font-weight: 650 !important;
  color: #172338 !important;
}

#create-overlay .modalheader .subtitle {
  color: #172338 !important;
  font-size: 12px !important;
  margin: 4px 0 0;
}

#create-overlay .modalcontent {
  overflow: auto;
  padding: 22px 24px 24px;
  flex: 1;
}

#create-overlay .modalfooter {
  border-top: 1px solid #e6ebf1;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fff;
}

.modalgrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 25px;
}

.form-section {
  margin: 0 0 22px;
}

.form-section h3 {
  font-size: 15px !important;
  margin: 0 0 13px;
  font-weight: 650 !important;
  color: #172338 !important;
}

.rangebar {
  padding: 14px 15px;
  border: 1px solid #d8e1ed;
  background: #f7f9fc;
  border-radius: 5px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
  align-items: center;
}

.rangebar strong {
  display: block;
  font-size: 13px !important;
  margin-top: 3px;
  color: #172338 !important;
}

.kindrow {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid #d6e0ed;
  border-radius: 5px;
  cursor: pointer;
  background: white;
  font-size: 13px !important;
  color: #172338 !important;
}

.toggle:has(input:checked) {
  border-color: #97b2e7;
  background: #eef3ff;
  color: #1d54b6 !important;
}

.preset-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 9px;
}

.direction-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.direction {
  display: flex;
  align-items: start;
  gap: 9px;
  border: 1px solid #d9e2ee;
  border-radius: 5px;
  padding: 10px 11px;
  cursor: pointer;
  min-height: 64px;
}

.direction:hover {
  background: #f8faff;
}

.direction:has(input:checked) {
  background: #f0f5ff;
  border-color: #b3c8f1;
}

.direction strong {
  display: block;
  font-size: 13px !important;
  margin-bottom: 3px;
  color: #172338 !important;
}

.direction span {
  display: block;
  color: #172338 !important;
  font-size: 12px !important;
  line-height: 1.45;
}

.sectionrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
}

.sectionrow h3 {
  margin: 0;
}

.sectionrow small {
  color: #172338 !important;
}

.customrow {
  display: flex;
  gap: 9px;
  margin-top: 10px;
}

.customrow input {
  flex: 1;
}

.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.token {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  background: #eef2f8;
  color: #172338 !important;
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 12px;
}

.promptactions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.counter {
  display: flex;
  justify-content: space-between;
  color: #172338 !important;
  font-size: 12px !important;
  padding-top: 6px;
}

.subtlebox {
  border: 1px solid #dfe6ef;
  border-radius: 6px;
  background: #f8fafc;
  padding: 14px 15px;
  margin-bottom: 14px;
}

.sidecaption {
  font-weight: 650 !important;
  font-size: 14px !important;
  margin: 0 0 10px;
  color: #172338 !important;
}

.summarylist {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 11px;
  font-size: 13px !important;
  color: #172338 !important;
}

.summarylist b {
  color: #172338 !important;
  text-align: right;
}

.samples {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 9px;
  margin: 12px 0;
}

.sample {
  border: 1px solid #d5dfe9;
  border-radius: 5px;
  padding: 0;
  background: white;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.sample img {
  display: block;
  width: 100%;
  height: 93px;
  object-fit: cover;
}

.sample .sampleid {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #172338 !important;
  padding: 6px 0;
}

.sample.checked {
  border: 2px solid #285fc9;
}

.sample.checked::after {
  content: '\u2713';
  position: absolute;
  right: 6px;
  top: 6px;
  border-radius: 3px;
  background: #285fc9;
  color: #fff;
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
}

.alert {
  padding: 10px 12px;
  border-radius: 5px;
  border: 1px solid #eadab2;
  background: #fff9ed;
  color: #896324;
  font-size: 12px;
  margin-bottom: 10px;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 180;
  background: rgba(10, 16, 25, 0.93);
  display: none;
  align-items: center;
  justify-content: center;
}

.lightbox.show {
  display: flex !important;
}

.lightbox img {
  max-width: 85vw;
  max-height: 84vh;
  object-fit: contain;
}

.lbnav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #ffffff22;
  color: white;
  border: 0;
  font-size: 35px;
  border-radius: 5px;
  width: 48px;
  height: 60px;
  cursor: pointer;
}

.lbnav.left {
  left: 18px;
}

.lbnav.right {
  right: 18px;
}

.lbclose {
  position: absolute;
  right: 25px;
  top: 20px;
  background: #ffffff22;
  color: white;
  border: 0;
  font-size: 25px;
  width: 39px;
  height: 39px;
  border-radius: 5px;
  cursor: pointer;
}

.lbcaption {
  position: absolute;
  bottom: 22px;
  color: white;
  font-size: 13px;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #23354e;
  color: white;
  border-radius: 6px;
  padding: 10px 18px;
  z-index: 990;
  box-shadow: 0 6px 22px #1220393d;
  display: none;
  font-size: 13px;
}

.toast.show {
  display: block;
}

.hide {
  display: none !important;
}

:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-page.hide { display: none !important; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-page { font: 13px/1.55 system-ui, "Microsoft YaHei", sans-serif; color: #172338; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-page h2 { font-size: 16px; font-weight: 650; margin: 0; color: #172338; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-scope { display: flex; gap: 14px; align-items: end; flex-wrap: wrap; margin: 0 0 18px; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-control { width: 250px; max-width: 100%; min-width: 0; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-child-control { width: 390px; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-control > label { display: block; margin: 0 0 7px; font-size: 13px; font-weight: 400; color: #172338; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-page input[type=checkbox], :is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-page input[type=radio] { accent-color: #285ed6; width: 16px; height: 16px; flex: none; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-kind { display: flex; align-items: center; gap: 20px; min-height: 38px; margin-left: 12px; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-kind label { display: inline-flex; align-items: center; gap: 7px; color: #172338; font-size: 13px; cursor: pointer; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-directions, :is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-prompt { padding: 20px 22px; background: white; border: 1px solid #dbe2eb; border-radius: 6px; margin-bottom: 18px; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table-wrap { overflow-x: auto; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table th { background: #f2f5fa; border-bottom: 1px solid #dbe2eb; padding: 12px 13px; text-align: left; font-weight: 400; color: #172338; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table td { border-bottom: 1px solid #e3eaf1; padding: 13px 13px; text-align: left; color: #172338; font-weight: 400; vertical-align: middle; overflow-wrap: anywhere; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table tr:last-child td { border-bottom: none; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table .kb-dir-check { width: 50px; text-align: center; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table .kb-dir-title { width: 28%; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-direction-table .kb-dir-action { width: 78px; text-align: right; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-directions-empty { padding: 28px 13px; text-align: center !important; font-weight: 400; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-prompt-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-prompt-note { min-height: 0; padding: 7px 0 0; font-size: 13px; color: #172338; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-prompt-note:empty { display: none; }
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-error { font-size: 13px; color: #a53b39; padding: 10px 0; }

/* UI-56-03 Confirm and Start Panel */
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-confirm {
  margin: 18px 0 32px !important;
  padding: 20px 22px !important;
  background: #fff !important;
  border: 1px solid #dbe2eb !important;
  border-radius: 6px !important;
}
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-confirm .exp-brief {
  font-size: 13px;
  color: #172338;
  gap: 20px;
  display: flex;
  flex-wrap: wrap;
  margin-top: 12px;
}
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-confirm .exp-brief span {
  font-size: 13px;
  color: #172338;
  font-weight: 400;
}
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-confirm .exp-summarybar {
  margin-top: 16px;
  min-height: 58px;
  gap: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-confirm #kb-run-check {
  font-size: 13px;
  color: #172338;
  font-weight: 400;
}
:is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-confirm .kb-setup-error {
  padding: 8px 0 0;
  margin: 0;
  color: #a53b39;
  font-size: 13px;
}
@media (max-width: 700px) {
  :is(#knowledge-page, .iad-knowledge-page) :is(.kb-v45, .iad-knowledge-page) .kb-setup-confirm {
    padding: 15px !important;
  }
}

`;var kg=`.iad-setup {max-width:1040px;min-width:0;padding:24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);}.iad-workbench .iad-short-field{flex:none;width:88px;margin:0 0 16px}.iad-short-field input{width:100%}.iad-form-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;padding-top:20px;margin-top:24px;border-top:1px solid var(--iad-border)}.iad-form-footer>.iad-muted{margin-right:auto}
.iad-setup-section {padding:var(--iad-space-6) 0;border-bottom:1px solid var(--iad-border);}
.iad-setup-section:first-of-type {padding-top:0;}.iad-setup-section:last-child {border:0;}
.iad-setup-section>h3 {margin:0 0 var(--iad-space-4);}
.iad-agent-prompts{display:grid;gap:16px;min-width:0}
.iad-agent-prompts+.iad-agent-prompts{margin-top:16px}
.exp-input textarea.iad-prompt-editor{--iad-prompt-editor-height:300px;box-sizing:border-box;width:100%;height:var(--iad-prompt-editor-height);min-height:var(--iad-prompt-editor-height);max-height:var(--iad-prompt-editor-height);resize:none;overflow:auto}
.iad-setup-section .iad-info-group {background:transparent;padding:0;margin:0;}
`;var Sg=`
:root, [data-page="industrial-datasets"] {
  --drawer-width: min(560px, 100vw);
  --line: #dfe5ee;
  --line-dark: #cbd5e1;
  --header: #f0f3f8;
  --select: #eaf0ff;
  --sub: #5f6f86;
  --primary: #2458d5;
  --hover: #f1f5fa;
  --radius: 5px;
  --shadow: 0 12px 36px rgba(20,34,60,.13);
}

[data-page="industrial-datasets"], [data-page="industrial-datasets"] * {
  box-sizing: border-box;
}

[data-ds-dark-theme] [data-page="industrial-datasets"] {
  --line: #4C5B6E;
  --line-dark: #4C5B6E;
  --header: #202B3A;
  --select: #293648;
  --sub: #B4C0D0;
  --primary: #A7C5FF;
  --hover: #293E60;
}

:is(.iad-workbench[data-page="industrial-datasets"], .iad-workbench[data-page="industrial-images"]) {
  position: relative;
  min-height: 100%;
}

.iad-dataset-page-wrap {
  width: 100%;
  min-width: 0;
  padding-right: 0 !important;
}

.iad-dataset-page-wrap.has-drawer {
  padding-right: 0 !important;
}

.iad-dataset-form{--iba-dialog-edit-width:740px}
.iad-manager-search-wrap{display:flex;align-items:center;gap:8px;margin-bottom:var(--iad-layout-gap)}
.iad-manager-search-wrap .search{width:220px;height:var(--iad-control-height)}

.search {
  width: 220px;
  height: 38px;
  padding: 0 12px;
  background: var(--iad-surface, #fff);
  border: 1px solid #b9c7d9;
  border-radius: 5px;
  font-size: 13px;
  color: var(--iba-unified-ink, #172338);
}

.table-wrap {
  background: var(--iad-surface, #fff);
  border: 1px solid var(--line-dark);
  border-radius: 5px;
  overflow: hidden;
}

.dataset-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.dataset-table col.name-col { width: 42%; }
.dataset-table col.format-col { width: 17%; }
.dataset-table col.metric-col { width: 13%; }
.dataset-table col.action-col { width: 100px; }

.dataset-table th {
  height: 43px;
  text-align: left;
  padding: 0 16px;
  background: var(--header);
  color: #62718a;
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid var(--line);
}

.dataset-table th.num { text-align: right; }
.dataset-table th:last-child { text-align: right; }

.dataset-table td {
  height: 55px;
  border-bottom: 1px solid #e6ebf1;
  padding: 6px 16px;
  font-size: 13px;
}

.dataset-table tr:last-child td { border-bottom: 0; }

.dataset-table tr.data-row { cursor: pointer; }
.dataset-table tr.data-row:hover { background: var(--hover); }
.dataset-table tr.data-row[data-selected="true"] { background: var(--select); }
.dataset-table tr.data-row[data-selected="true"] td:first-child { box-shadow: inset 3px 0 var(--primary); }
.dataset-table tr.parent-row { background: #f8faff; }
.dataset-table tr.parent-row:hover { background: #eef3ff; }
[data-ds-dark-theme] .dataset-table tr.parent-row { background: rgba(255,255,255,0.02); }
[data-ds-dark-theme] .dataset-table tr.parent-row:hover { background: rgba(255,255,255,0.05); }

.dataset-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.dataset-table .muted { color: #77879e; }

.name-area {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.name-area>button[data-icon=edit]{margin-left:auto}
.name-area.child { padding-left: 33px; }
.expand[data-expanded="false"] svg { transform: rotate(-90deg); }

.name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.parent-row .name-text { font-weight: 400; }
.dataset-table tr[data-selected="true"] .name-text { color: #153b8e; }
[data-ds-dark-theme] .dataset-table tr[data-selected="true"] .name-text { color: var(--primary); }


.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.edit-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.edit-input {
  height: 33px;
  width: 100%;
  max-width: 100%;
  min-width: 100px;
  border: 1px solid #4f7be7;
  border-radius: 5px;
  padding: 0 8px;
  background: var(--iad-surface, #fff);
  color: inherit;
  outline: none;
}

.blank {
  padding: 30px;
  text-align: center;
  color: var(--sub);
}

/* Drawer styles - overlay without squeezing page */
.drawer-root {
  display: none;
  position: fixed;
  z-index: 50;
  inset: 0;
  pointer-events: none;
}

.drawer-root.open { display: block; }

.drawer-backdrop { display: none; }

.dataset-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: var(--drawer-width);
  height: 100vh;
  padding: 0;
  background: var(--iad-surface, #fff);
  border-left: 1px solid var(--line-dark);
  box-shadow: -10px 0 32px rgba(20, 34, 60, 0.16);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;
  z-index: 51;
}

.drawer-top {
  padding: 27px 26px 17px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
}

.drawer-heading { min-width: 0; }

.drawer-heading h2 {
  font-size: 20px;
  line-height: 1.45;
  font-weight: 700;
  overflow-wrap: anywhere;
  margin: 0;
}

.drawer-heading .detail-sub {
  font-size: 12px;
  color: var(--sub);
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.drawer-body {
  overflow-y: auto;
  min-height: 0;
  flex: 1;
  padding: 22px 25px 32px;
}

.dataset-drawer .detail-card {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.dataset-drawer .single-section > h3 {
  font-size: 15px;
  font-weight: 650;
  margin: 0 0 25px;
}

.dataset-drawer .fields { display: grid; gap: 20px; }
.dataset-drawer .field label { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 550; }
.dataset-drawer .field .control { display: flex; gap: 10px; }

.dataset-drawer .field .control input {
  min-width: 0;
  flex: 1;
}

.dataset-drawer .field .control button { flex: none; }

.identifier-section {
  border-top: 1px solid var(--line);
  margin-top: 24px;
  padding-top: 20px;
}

.identifier-section h3 {
  font-size: 15px;
  line-height: 1.4;
  font-weight: 650;
  margin: 0 0 18px;
}

.identifier-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.identifier-value span {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 550;
  color: inherit;
}

.identifier-value .copy-id {
  margin-left: auto;
}

.group-identifier .identifier-section {
  border-top: 0;
  margin-top: 0;
  padding-top: 0;
}

.dataset-drawer .detail-footer {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 66px;
  gap: 13px;
}

.dataset-drawer .detail-footer .help {
  min-height: 15px;
  color: var(--sub);
  font-size: 12px;
  margin: 0;
}

.dataset-drawer .detail-footer .buttons {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  align-items: center;
}

/* Mapping area */
.mapping-area { margin-top: 0; }
.mapping-table { border: 1px solid var(--line); border-radius: 5px; overflow: hidden; }

.mapping-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.mapping-row:last-child { border-bottom: none; }
.mapping-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mapping-row select {
  min-width: 110px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #273955;
  color: white;
  padding: 11px 17px;
  border-radius: 6px;
  font-size: 13px;
  z-index: 100;
  box-shadow: var(--shadow);
  max-width: 90%;
  text-align: center;
  transition: opacity .2s ease;
}

.toast.hidden { display: none; }

/* Responsive */
@media(max-width: 1200px) {
  .iad-dataset-page-wrap.has-drawer { padding-right: 0 !important; }
  .drawer-root.open { pointer-events: auto; }
  .drawer-root.open .drawer-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15,25,43,.22);
    pointer-events: auto;
    z-index: 50;
  }
  .dataset-drawer {
    width: min(540px, 95vw);
    box-shadow: -8px 0 30px rgba(0,0,0,.17);
    z-index: 51;
  }
}

@media(max-width: 760px) {
  .drawer-top { padding: 19px 15px; }
  .drawer-body { padding: 15px; }
}

`;var Ig=`
.iad-consistency .iad-consistency-query{padding:18px 20px 16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;margin-bottom:14px}
.iad-consistency .iad-consistency-query .iad-row{align-items:end;gap:12px;flex-wrap:wrap}.iad-consistency-query .iad-filter{min-width:145px;gap:7px;color:var(--iad-muted);font-size:12px}.iad-consistency-query .iad-filter :is(select,input){font-size:14px;height:40px}
.iad-consistency-summary{margin:12px 0 14px}.iad-consistency-status{display:flex;align-items:center;flex-wrap:wrap;gap:10px 24px;padding:11px 15px;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface-muted);font-size:12px}.iad-consistency-status strong{font-weight:650}.iad-consistency-status>span{white-space:nowrap}
.iad-consistency-summary-details{margin-left:auto;position:relative}.iad-consistency-summary-details>summary{cursor:pointer;color:var(--iad-muted)}.iad-consistency-summary-body{position:absolute;right:0;top:28px;z-index:8;width:540px;max-width:75vw;padding:16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px}.iad-consistency-summary-body .iad-row{gap:10px}
.iad-consistency-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:290px;padding:44px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;text-align:center;color:var(--iad-text);font-weight:400}.iad-consistency-empty p{margin:0 0 18px;max-width:560px}.iad-consistency-empty .iad-row{justify-content:center}
.iad-consistency-list,.iad-consistency-detail{min-width:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;overflow:hidden}
.iad-consistency-panel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 16px 13px;border-bottom:1px solid var(--iad-border)}.iad-consistency-panel-header strong{font-size:15px}.iad-consistency-panel-header>span{color:var(--iad-muted);font-size:12px}
.iad-consistency-detail-body{padding:16px}.iad-consistency-detail-actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:14px;margin-top:14px;border-top:1px solid var(--iad-border)}
.iad-consistency-search-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px;align-items:start}.iad-consistency-candidate-grid{display:grid;align-content:start;align-items:start;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:16px;max-height:570px;overflow:auto;min-height:360px}.iad-consistency-candidate-grid>button{display:flex;flex-direction:column;gap:5px;min-width:0;text-align:left;white-space:normal}.iad-consistency-candidate-grid img{display:block;width:100%;height:146px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-candidate-grid strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.iad-consistency-candidate-grid :is(span,small){font-size:12px;color:var(--iad-muted)}.iad-consistency-detail-photo{width:100%;height:290px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-detail-body dl{display:grid;grid-template-columns:90px minmax(0,1fr);gap:7px;font-size:12px;margin-top:14px}.iad-consistency-detail-body dt{color:var(--iad-muted)}.iad-consistency-detail-body dd{margin:0;overflow-wrap:anywhere}.iad-consistency-result-pagination{margin:12px 0}
.iad-consistency-jobs{display:grid;gap:16px;margin-top:14px}.iad-consistency-jobs .iad-resource-table{width:100%;table-layout:fixed}.iad-consistency-jobs .iad-resource-table :is(th,td){padding:13px 16px}.iad-consistency-jobs .iad-resource-table tr[aria-selected=true]{background:var(--iad-hover)}.iad-consistency-jobs td small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--iad-muted);font-size:11px;margin-top:4px}.iad-consistency-jobs [aria-label="\u6279\u6B21\u8BE6\u60C5"]{padding:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-jobs progress{width:100%;accent-color:var(--iad-primary)}.iad-consistency-text-button{min-height:0;border:0;background:none;padding:0;text-align:left;color:var(--iad-primary)}
.iad-consistency-expanded{margin-top:14px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-expanded>.iad-consistency-layout{padding:16px;margin:0}
.iad-consistency-query fieldset,.iad-consistency-review fieldset{border:0;padding:0;margin:0;min-width:0}
.iad-consistency-query .iad-filter input{min-width:0;max-width:100%}.iad-consistency-query input[type=file]{width:178px}.iad-consistency-query .iad-query-search{flex:1;min-width:190px}.iad-consistency-query .iad-query-search input{width:100%}.iad-consistency-query .iad-query-sample{flex:0 1 224px;min-width:200px}.iad-consistency-query .iad-query-sample select{width:100%}
.iad-consistency-query .iad-pagination{padding:0;margin-left:auto}.iad-consistency-query-actions{margin-top:14px}.iad-consistency-advanced summary{cursor:pointer;min-height:40px;display:flex;align-items:center;color:var(--iad-muted)}.iad-consistency-advanced[open]{flex:1}.iad-consistency-advanced .iad-row{margin:8px 0}
.iad-consistency-scope summary{cursor:pointer;min-height:40px;display:flex;align-items:center}.iad-consistency-scope label{display:flex;align-items:center;gap:8px;margin:8px 0}
.iad-consistency-results>p{margin:8px 0 16px}.iad-consistency-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:start;margin-top:20px}
.iad-consistency-differences{min-width:0;max-height:620px;overflow:auto}.iad-consistency-differences button{display:flex;flex-direction:column;align-items:stretch;text-align:left;white-space:normal;width:100%;gap:6px;margin-bottom:8px}
.iad-consistency-comparison{min-width:0}
.iad-consistency .iad-embedded-canvas{height:470px;min-height:0}.iad-consistency .iad-lightbox-toolbar{gap:6px;padding:10px;flex-wrap:wrap}.iad-consistency .iad-viewer-heading{flex-basis:100%}.iad-consistency .iad-viewer-heading strong{font-size:12px}.iad-consistency .iad-viewer-zoom select{width:112px}
.iad-consistency-differences h2{font-size:16px;margin:0 0 12px}.iad-consistency-differences dl{grid-template-columns:80px minmax(0,1fr)}.iad-consistency-region rect{stroke:var(--iad-danger);fill:none;stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke}
.iad-consistency .iad-frozen-comparison .iad-embedded-canvas{height:620px}

.iad-consistency-gallery-panel{min-width:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;overflow:hidden}
.iad-consistency-gallery-panel .iad-consistency-panel-header{flex-wrap:wrap}.iad-consistency-gallery-panel .iad-row{gap:8px}.iad-consistency-gallery-panel input{width:250px}
.iad-consistency-gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;padding:16px;align-items:stretch}
.iad-consistency-gallery .iad-consistency-image-card{display:flex;flex-direction:column;min-width:0;text-align:left;padding:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px;overflow:hidden;white-space:normal}
.iad-consistency-gallery .iad-consistency-image-card:hover{border-color:var(--iad-primary);background:var(--iad-surface)}
.iad-consistency-card-image{position:relative;display:flex;align-items:center;justify-content:center;height:159px;background:var(--iad-viewer);color:var(--iad-on-viewer)}.iad-consistency-card-image>img{width:100%;height:100%;object-fit:contain}
.iad-consistency-card-count{position:absolute;top:8px;right:8px;padding:3px 6px;border-radius:3px;background:var(--iad-viewer);color:var(--iad-on-viewer);font-size:11px}
.iad-consistency-model-state{display:block;padding:0 10px 10px;font-size:11px;color:var(--iad-muted)}.iad-group-overall{margin-top:16px}.iad-group-overall h4{margin:0 0 8px;font-size:14px}.iad-group-overall p{margin:0;line-height:1.7}.iad-consistency-card-caption{display:grid;gap:8px;padding:10px;min-width:0}.iad-consistency-card-caption>strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iad-consistency-card-caption>div{display:flex;justify-content:space-between;gap:8px;color:var(--iad-muted);font-size:11px}.iad-consistency-badge{display:inline-block;padding:2px 5px;border-radius:3px;background:var(--iad-hover);color:var(--iad-primary);font-size:11px;font-weight:400}
.iad-detail-dialog.iad-consistency-group-dialog{width:min(1520px,96vw);height:94vh;max-width:96vw;max-height:94vh;padding:0;overflow:hidden;border:0;border-radius:7px}
.iad-consistency-group-dialog[open]{display:flex;flex-direction:column}.iad-group-header,.iad-group-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 22px;flex:none;background:var(--iad-surface)}.iad-group-header{border-bottom:1px solid var(--iad-border)}.iad-group-header>div:first-child{min-width:0}.iad-group-header h2{font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:3px 0}.iad-group-header p{margin:0;font-size:12px;color:var(--iad-muted)}.iad-group-header span{font-size:11px}.iad-group-header .iad-row{flex-wrap:nowrap;gap:8px}
.iad-group-scroll{display:flex;flex-direction:column;flex:1;min-height:0;padding:18px 24px 0;overflow:hidden}.iad-group-visuals{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding-bottom:8px}.iad-consistency-group-dialog .iad-image-pair{margin-top:0}.iad-consistency-group-dialog .iad-image-pair-side>p{font-size:13px;font-weight:600;margin:0 0 8px;color:var(--iad-text)}.iad-consistency .iad-consistency-group-dialog .iad-embedded-canvas{height:clamp(280px,39vh,430px)}.iad-consistency-group-dialog .iad-lightbox-toolbar{padding:5px;gap:4px;flex-wrap:nowrap}.iad-consistency-group-dialog .iad-viewer-heading{display:none}.iad-consistency-group-dialog .iad-viewer-zoom select{width:90px}.iad-consistency-group-dialog .iad-viewer-body{margin-top:0}
.iad-group-image-names{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px;color:var(--iad-muted);font-size:11px}.iad-group-image-names span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iad-group-candidates{margin:20px 0 16px}.iad-group-candidates>.iad-row{justify-content:space-between;gap:10px}.iad-group-candidates h3{margin:0 auto 8px 0;font-size:13px}.iad-group-candidate-strip{display:flex;overflow:auto;gap:10px;padding:3px 1px 8px}.iad-group-candidate-strip>button{display:grid;flex:0 0 116px;gap:4px;text-align:left;min-width:0}.iad-group-candidate-strip img{width:104px;height:94px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-group-candidate-strip strong{font-size:11px}.iad-group-candidate-strip span{font-size:10px;color:var(--iad-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:104px}
.iad-group-analysis{flex:none;max-height:40%;overflow:auto;overscroll-behavior:contain;border-top:1px solid var(--iad-border);padding-bottom:16px}.iad-group-analysis h3{font-size:14px}.iad-group-analysis .iad-tab-panel{padding:16px 0 0}.iad-group-analysis .iad-consistency-differences{max-height:none;overflow:visible}.iad-group-references{display:grid;grid-template-columns:60px minmax(0,1fr);gap:6px;font-size:12px}.iad-group-references dd{margin:0;overflow-wrap:anywhere}.iad-group-fact{display:flex;align-items:center;gap:16px;padding:12px 0;border-top:1px solid var(--iad-border);font-size:12px}.iad-group-fact>button{margin-left:auto}.iad-group-footer{border-top:1px solid var(--iad-border)}
.iad-group-conclusions{display:block}.iad-group-conclusions>p{margin:12px 0;font-size:13px;line-height:1.7}.iad-group-limitations{margin-top:12px;padding:12px;background:var(--iad-surface-muted);color:var(--iad-muted);font-size:12px}.iad-group-limitations p{margin:0}
.iad-consistency-job-summary{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.6fr) repeat(2,minmax(0,1fr));gap:0;margin:14px 0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:12px 0}
.iad-consistency-job-summary>div{min-width:0;padding:2px 18px;border-right:1px solid var(--iad-border);display:flex;flex-direction:column;align-items:start;gap:5px}.iad-consistency-job-summary>div:last-child{border-right:0}.iad-consistency-job-summary>div>span:first-child,.iad-consistency-job-summary small{color:var(--iad-muted);font-size:12px}.iad-consistency-job-summary strong{font-size:18px}.iad-consistency-job-summary .iad-job-sync{position:relative;margin:0;padding-right:55px;gap:8px}.iad-consistency-job-summary .iad-job-sync>span[role=status]{color:var(--iad-text);font-weight:600;font-size:14px}.iad-consistency-job-summary .iad-job-sync>button{position:absolute;right:12px;top:12px;margin:0}.iad-consistency-job-detail-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.iad-consistency-job-detail-heading h2{font-size:15px;margin:0}.iad-consistency-job-detail-heading strong{font-size:12px;color:var(--iad-primary)}.iad-consistency-job-progress{gap:16px;margin:12px 0}.iad-consistency-child-jobs{margin:18px 0}.iad-consistency-child-jobs>summary{cursor:pointer;font-size:12px;color:var(--iad-muted);padding:8px 0}.iad-consistency-jobs [aria-label="\u6279\u6B21\u6BD4\u8F83\u7ED3\u679C"] h3{font-size:14px}.iad-consistency-jobs [aria-label="\u6279\u6B21\u6BD4\u8F83\u7ED3\u679C"]>.iad-row{padding:12px 0;border-top:1px solid var(--iad-border);font-size:12px}
.iad-consistency-report-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:10px 0}.iad-consistency-report-strip>div{display:grid;gap:6px;align-content:start;padding:2px 16px;border-right:1px solid var(--iad-border);min-width:0}.iad-consistency-report-strip>div:last-child{border-right:0}.iad-consistency-report-strip :is(span,small){color:var(--iad-muted);font-size:11px}.iad-consistency-report-strip strong{font-size:16px}.iad-consistency-report-strip>div:first-child strong{font-size:14px}.iad-consistency-report-tools{display:flex;align-items:center;gap:12px;margin:6px 0;font-size:12px}.iad-consistency-summary-details{margin-left:auto}.iad-consistency-summary-details>summary{padding:3px 0}
.iad-consistency-filter-chips{display:flex;gap:10px;padding:12px 16px 0;flex-wrap:wrap}
@container workbench (max-width:1200px){.iad-consistency-gallery{grid-template-columns:repeat(4,minmax(0,1fr))}}

:root {
  --blue: #285ed6;
  --blue-light: #eaf0ff;
  --border: #dbe2eb;
  --border2: #e6ebf1;
  --ink: #17233a;
  --sub: #64748b;
  --surface-alt: #f9fafc;
}

.dc-root{min-width:0}
.dc-heading-actions{display:flex;align-items:center;gap:8px}
.dc-section{margin:0 0 var(--iad-layout-gap)}
.dc-results-section{background:var(--iad-surface);border:1px solid var(--iad-panel-border);border-radius:6px;box-shadow:none;padding:0}
.dc-results-body{padding:18px 20px 22px}
.dc-result-panel{min-height:100dvh}
.dc-empty{min-height:132px;display:flex;align-items:center;justify-content:center;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:24px;text-align:center}
.dc-refined-filterbar{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:0 0 17px;min-height:56px}
.dc-filter-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.dc-search-field input{width:100%;height:38px;border:1px solid var(--iad-control-border);border-radius:5px;background:var(--iad-surface);padding:0 12px;font:inherit;color:var(--iad-text)}
.dc-results-section .dc-conflict-grid{gap:14px}
.dc-results-section .dc-conflict-grid>button.iad-thumbnail-card{border-color:var(--iad-panel-border);border-radius:5px}
.dc-dialog-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex:none}
.dc-dialog-head-actions{display:flex;align-items:center;gap:8px}
.dc-dialog-head-actions button{white-space:nowrap}
.dc-dialog-body{display:block;min-height:0;overflow:auto;flex:1;scrollbar-gutter:stable}
.dc-group-review-form{display:flex;flex-direction:column;flex:1;min-height:0}
.dc-compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.dc-compare-cell{min-width:0}
.dc-compare-photo{height:450px;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface-muted);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:zoom-in}
.dc-compare-photo img{height:100%;width:100%;object-fit:contain}
.dc-photo-filename{line-height:20px;margin:7px 2px 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dc-decision-controls{display:flex;gap:16px;flex-wrap:wrap;margin:10px 0 14px}
.dc-decision-controls label{display:inline-flex;align-items:center;gap:7px}
.dc-decision-controls input{height:16px;width:16px;accent-color:var(--iad-primary)}
.dc-note{width:100%;height:58px;min-height:58px;padding:10px;border:1px solid var(--iad-control-border);border-radius:5px;resize:vertical;color:var(--iad-text);background:var(--iad-surface)}
.dc-dialog-footer{display:flex;gap:8px;justify-content:flex-end;flex:none}
@media(max-width:1000px){.dc-compare{grid-template-columns:1fr}}
@media(max-width:650px){.dc-scope{display:grid}.dc-dialog-head-actions{gap:4px}}

.dc-stats-content {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  min-height: 0 !important;
  padding: 22px 25px 25px !important;
}
.dc-stats-charts {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) !important;
  gap: 13px !important;
  align-items: stretch !important;
}
.dc-vchart-panel {
  width: 100% !important;
  min-width: 0 !important;
  padding: 14px 18px 12px !important;
  border: 1px solid var(--border, #dbe2eb) !important;
  border-radius: 7px !important;
  background: #fff !important;
}
.dc-vchart-panel h3 {
  font-size: 14px !important;
  font-weight: 650 !important;
  color: var(--ink, #17233a) !important;
  margin: 0 0 11px !important;
}
.dc-vchart-body {
  display: grid !important;
  grid-template-columns: 32px minmax(0, 1fr) !important;
  gap: 9px !important;
  min-width: 0 !important;
}
.dc-vchart-axis {
  height: 115px !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  align-items: flex-end !important;
  color: #7b889b !important;
  font-size: 11px !important;
  font-variant-numeric: tabular-nums !important;
}
.dc-vchart-figure {
  position: relative !important;
  min-width: 0 !important;
  overflow: visible !important;
}
.dc-vchart-lines {
  pointer-events: none !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 115px !important;
  background: linear-gradient(to bottom, #e2e8f0 0 1px, transparent 1px 24.8%, #e2e8f0 25% calc(25% + 1px), transparent calc(25% + 1px) 49.8%, #e2e8f0 50% calc(50% + 1px), transparent calc(50% + 1px) 74.8%, #e2e8f0 75% calc(75% + 1px), transparent calc(75% + 1px) 99.5%, #b9c8dc 100%) !important;
  z-index: 0 !important;
}
.dc-vchart-columns {
  position: relative !important;
  z-index: 1 !important;
  display: grid !important;
  grid-template-columns: repeat(var(--chart-cols, 6), minmax(0, 1fr)) !important;
  gap: 4px !important;
  min-width: 0 !important;
}
.dc-vchart-column {
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}
.dc-vchart-barslot {
  height: 115px !important;
  width: 100% !important;
  display: flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  min-width: 0 !important;
}
:is(.iad-workbench, body) button.dc-vchart-bar,button.dc-vchart-bar {
  position: relative !important;
  width: clamp(16px, 65%, 42px) !important;
  flex: none !important;
  cursor: pointer !important;
}
.dc-vchart-bar {
  position: relative !important;
  width: clamp(16px, 65%, 42px) !important;
  border: 0 !important;
  border-radius: 4px 4px 0 0 !important;
  background: #5379d2 !important;
  cursor: default !important;
  min-height: 2px !important;
  padding: 0 !important;
  transition: background 0.14s ease !important;
  flex: none !important;
  box-shadow: none !important;
}
button.dc-vchart-bar:hover,button.dc-vchart-bar:focus-visible {
  background: #2859c2 !important;
}
.dc-vchart-zero {
  background: #c6d2e4 !important;
}
.dc-vchart-value {
  position: absolute !important;
  bottom: calc(100% + 6px) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 650 !important;
  font-variant-numeric: tabular-nums !important;
  color: #243b63 !important;
  pointer-events: none !important;
  white-space: nowrap !important;
}
.dc-vchart-label {
  width: 100% !important;
  min-height: 28px !important;
  padding-top: 8px !important;
  display: block !important;
  text-align: center !important;
  font-size: 12px !important;
  line-height: 1.35 !important;
  overflow-wrap: anywhere !important;
  color: #596b84 !important;
}
.dc-vchart-agreement {
  grid-column: auto !important;
  width: 100% !important;
  justify-self: stretch !important;
}
.dc-vchart-agreement .dc-vchart-axis,
.dc-vchart-agreement .dc-vchart-lines,
.dc-vchart-agreement .dc-vchart-barslot {
  height: 115px !important;
}
.dc-vchart-agreement .dc-vchart-columns {
  width: min(640px, 100%) !important;
  margin: 0 auto !important;
}
.dc-vchart-agreement .dc-vchart-bar {
  width: min(54px, 62%) !important;
}

.dc-images-panel,
.dc-fact-panel,
.dc-model-panel,
.dc-conclusion-panel,
.dc-review-panel {
  border-top: 1px solid #e4eaf1 !important;
  margin-top: 16px !important;
  padding-top: 16px !important;
}
.dc-images-panel .iad-thumbnail-card>.iad-thumbnail-caption{display:none}
.dc-images-panel h3,
.dc-fact-panel h3,
.dc-model-panel h3,
.dc-conclusion-panel h3,
.dc-review-panel h3 {
  font-size: 14px !important;
  font-weight: 650 !important;
  color: var(--iba-unified-ink, #172338) !important;
  margin: 0 0 8px !important;
}
.dc-fact-panel .dc-verdict-value,
.dc-conclusion-panel .dc-verdict-value {
  display: block !important;
  color: var(--iba-unified-ink, #172338) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.6 !important;
}
.dc-fact-panel .dc-verdict-description,
.dc-conclusion-panel .dc-verdict-description,
.dc-model-panel p,
.dc-fact-panel p,
.dc-conclusion-panel p {
  display: block !important;
  color: var(--iba-unified-ink, #172338) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.7 !important;
  margin: 5px 0 0 !important;
}
.dc-candidate-group h4{font-size:13px;font-weight:500;margin:10px 0 4px}
.dc-candidate-group p{font-size:13px;margin:5px 0}
.dc-model-panel .dc-analysis-sources{font-weight:600!important;overflow-wrap:anywhere}
.dc-model-panel p{white-space:pre-wrap;overflow-wrap:anywhere}
`;var Eg=`
.iad-image-quality{position:absolute;left:9px;top:9px;z-index:2;padding:4px 9px;border-radius:4px;background:var(--iad-surface);color:var(--iad-text);font-weight:650;pointer-events:none}
.iad-image-quality[data-quality="OK"]{color:var(--iad-success,#24844b)}
.iad-image-quality[data-quality="NG"]{color:var(--iad-danger,#c44545)}
.main{width:100%;min-width:0;padding:0}
.crumb{color:#8190a6;font-size:11px;margin:0 0 2px}
.heading-side{font-size:12px;color:#8190a6}

.field{display:flex;flex-direction:column;gap:5px;min-width:0}
.field>label,.filter-item>label{font-size:12px;color:#586a84}
.dataset-panel .parent{width:265px}
.dataset-panel .child{width:410px}
.dataset-panel select{width:100%;height:38px}

.filter-bar{background:var(--surface,#fff);border:1px solid var(--border,#dbe2eb);border-radius:7px;min-height:96px;padding:16px 14px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:var(--iad-layout-gap)}
.filter-item{display:flex;flex-direction:column;gap:var(--iad-layout-label-gap);min-width:0}
.filter-item>label{line-height:var(--iad-layout-label-height)}
.filter-item input,.filter-item select{height:38px}
.filter-search{flex:1 1 240px;min-width:180px}
.filter-search input{width:100%}
.filter-status{width:136px}
.filter-ann{width:142px}
.filter-category{width:176px}
.filter-sort{width:143px}
.btn-reset{border:1px solid var(--border,#dbe2eb);color:#55667e;background:#fff;height:38px;padding:0 14px;border-radius:5px;white-space:nowrap}

.empty{min-height:200px;border:1px dashed var(--border,#dbe2eb);border-radius:8px;display:grid;place-items:center;color:#738398;background:#fff}

.full-overlay {position:fixed;inset:0;z-index:10010;display:flex;align-items:stretch;justify-content:stretch;padding:0;background:#1c2633}
.full-overlay.hidden {display:none !important}
.detail-preview{flex:none;width:100%;height:355px;display:flex;justify-content:center;align-items:center;border:1px solid var(--border2,#e6ebf1);border-radius:6px;background:#f2f5f9;cursor:zoom-in;padding:0;position:relative;overflow:hidden}
.detail-preview:hover{border-color:#95afed}
.detail-preview:focus-visible{outline:2px solid var(--blue,#285ed6)}
.preview-image-frame, .detail-preview .preview-image-frame{position:relative;height:100%;max-width:100%;max-height:100%;display:flex;justify-content:center;align-items:center}
.preview-image-frame img, .detail-preview img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.preview-overlay{position:absolute;inset:0;pointer-events:none}
.preview-overlay .bbox{position:absolute;border:2px solid #f1b14b;box-shadow:0 0 0 1px #16304788;min-height:3px;min-width:3px;box-sizing:border-box}
.preview-overlay .bbox::before{content:attr(data-label);position:absolute;left:-2px;bottom:100%;padding:1px 4px;color:#fff;font-size:11px;line-height:17px;background:#263d59;white-space:nowrap;border-radius:2px}
.preview-overlay .bbox:nth-child(even){border-color:#ffca64}
.detail-preview-hint {position:absolute;right:11px;bottom:11px;background:#17243bd9;border-radius:4px;padding:5px 9px;color:#fff;font-size:11px;opacity:0;transition:opacity .15s}
.detail-preview:hover .detail-preview-hint,.detail-preview:focus-visible .detail-preview-hint{opacity:1}
.detail-content {margin-top:20px;padding:16px 0 0}
.detail-section-heading{font-size:13px;font-weight:650;margin:0 0 12px;color:#26344c}
.detail-meta {display:grid;grid-template-columns:104px minmax(0,1fr);gap:11px 20px;margin:0;font-size:12px;align-items:start}
.detail-meta dt{color:#72829b}
.detail-meta dd{margin:0;color:#24334d;min-width:0;overflow-wrap:anywhere}
.detail-meta dd.monospace{font-family:inherit;font-size:inherit;font-weight:inherit;letter-spacing:inherit}
.detail-meta dd.path-value{overflow-wrap:anywhere}
.detail-part{margin-top:20px;padding-top:16px;border-top:1px solid var(--border2,#e6ebf1)}
.detail-ann-row {display:flex;align-items:center;gap:12px;border:1px solid #e4e9f2;background:#f8fafc;padding:10px 12px;border-radius:5px;font-size:12px}
.detail-ann-row strong {font-weight:600}
.detail-ann-row span {margin-left:auto;color:#718097;font-size:11px}
.detail-fallback{font-size:12px;color:#76859c}
.detail-tip{font-size:11px;color:#8c99ab;margin-top:10px}

.full-overlay {z-index:10010;display:flex;align-items:stretch;justify-content:stretch;padding:0;background:#1c2633}
.full-dialog {display:flex;flex-direction:column;width:100vw;height:100dvh;min-width:0;min-height:0;background:#202a36}
.full-toolbar {position:relative;height:52px;flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#1c2633;border-bottom:1px solid rgba(255,255,255,.08);padding:0 20px;color:#f4f7fd}
.full-toolbar>.iad-image-quality{left:50%;top:50%;transform:translate(-50%,-50%);padding:0;border-radius:0;background:transparent;color:inherit;font-size:13px;font-weight:600}
.full-file{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;max-width:calc(50% - 48px);flex:1;color:#f4f7fd !important}
.full-stage {flex:1;position:relative;overflow:hidden;min-height:0;background:#202a36;touch-action:none;cursor:grab}
.full-stage.dragging{cursor:grabbing}
.full-image-world {position:absolute;left:50%;top:50%;transform-origin:center;user-select:none}
.full-image-world img {display:block;width:100%;height:100%;pointer-events:none;user-select:none}
.full-annotation-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.full-annotation-layer.hidden{display:none}
.full-annotation-layer .bbox{position:absolute;border:2px solid #ffb74c;box-shadow:0 0 0 1px #152b4099;min-height:3px;min-width:3px;background:transparent !important;box-sizing:border-box}
.full-annotation-layer .bbox::before{content:attr(data-label);position:absolute;bottom:100%;left:-2px;border-radius:2px;background:#152538;color:#fff;font-size:11px;line-height:17px;padding:1px 4px}
.full-annotation-layer .bbox:nth-child(even){border-color:#ffdc72}
.full-side-nav {position:absolute;z-index:1;top:50%;transform:translateY(-50%);height:56px;width:48px;border:1px solid transparent;background:transparent;color:#f4f7fd;border-radius:6px;font-size:34px;display:grid;place-items:center;box-shadow:none;text-shadow:0 1px 2px #10182799;transition:background .15s ease,border-color .15s ease;cursor:pointer}
.full-side-nav:hover:not(:disabled),.full-side-nav:focus-visible{background:rgba(255,255,255,.24) !important;border-color:rgba(255,255,255,.25) !important}
.full-side-nav.prev{left:18px}.full-side-nav.next{right:18px}
.full-side-nav:disabled{opacity:.18;cursor:default}
.full-side-nav:disabled:hover{background:transparent;border-color:transparent}

.full-actions{display:flex;align-items:center;gap:6px;flex:none;white-space:nowrap}

/* Zoom Dropdown: background & border slightly brighter than canvas background */
.full-actions .zoom-wrap{position:relative;flex:none;display:inline-flex;align-items:center;background:rgba(255,255,255,.12) !important;border:1px solid rgba(255,255,255,.22) !important;border-radius:6px;transition:background .15s ease,border-color .15s ease}
.full-actions .zoom-wrap:hover{background:rgba(255,255,255,.20) !important;border-color:rgba(255,255,255,.36) !important}
.full-actions select{min-width:96px;width:96px;height:36px;appearance:none;-webkit-appearance:none;padding:0 24px 0 10px;text-align:center;text-align-last:center;border:none !important;background:transparent !important;color:#f4f7fd !important;font:500 13px/36px system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;cursor:pointer;outline:none}
.full-actions .zoom-wrap:focus-within{outline:2px solid #a1c6ff;outline-offset:1px;border-color:transparent}
.full-actions .zoom-chevron{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:14px;height:14px;display:grid;place-items:center;color:#b2c2d6;pointer-events:none}
.full-actions .zoom-chevron svg{width:14px;height:14px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;filter:none}
.full-actions select option{color:#192b46;background:#fff;text-shadow:none}
.full-actions .full-close{margin-left:6px}
.full-actions svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 2px rgba(0,0,0,.72));pointer-events:none}

.detail-ann-table {width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;color:#293951}
.detail-ann-table th{background:#f2f5fa;color:#6b7b91;font-weight:500;text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0}
.detail-ann-table td{padding:11px 10px;border-bottom:1px solid #ebeff5;vertical-align:middle;overflow-wrap:anywhere}
.detail-ann-table tr:last-child td{border-bottom:none}
.detail-ann-table th:first-child,.detail-ann-table td:first-child{width:44px;color:#687b97}
.detail-ann-table th:nth-child(2),.detail-ann-table td:nth-child(2){width:135px}
.detail-ann-table th:nth-child(3),.detail-ann-table td:nth-child(3){width:80px}
.detail-ann-table td.annotation-coord{font-family:inherit;font-size:inherit;white-space:normal}
.detail-ann-summary{font-size:12px;color:#63738c;font-weight:400;padding-left:8px}
.detail-annotation-heading{display:flex;align-items:baseline;margin-bottom:12px}
.detail-annotation-heading h3{margin:0}
.detail-section-heading, .detail-meta dt, .detail-meta dd {font-family:inherit;letter-spacing:normal}
.detail-ann-label{display:grid;grid-template-columns:104px 1fr;gap:20px;font-size:12px;padding:8px 0}
.detail-ann-label span:first-child{color:#72829b}

.dataset-panel .child{position:relative}
.detail-ann-table tr:last-child td{border-bottom:0}
.detail-ann-table .ann-value{font:inherit;color:#34435d;white-space:normal}

.detail-model-section{margin-top:18px;padding-top:16px;border-top:1px solid var(--border2,#e6ebf1)}
.detail-model-section .detail-section-heading{margin-bottom:10px}
.detail-model-text{font:inherit;font-size:12px;color:#596a82;line-height:1.65;margin:0}
.detail-model-result{font:inherit;font-size:12px;color:#31435d;line-height:1.65;margin:0 0 6px}
.detail-model-result strong{font-weight:600}
.detail-model-demo{font-size:11px;color:#8996aa;margin-left:8px}

.dataset-panel select,.filter-item select{
  -webkit-appearance:none;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23566880' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-size:16px 16px;
  background-position:right 11px center;padding-right:35px;background-color:var(--surface,#fff);
}
#reset{margin-left:0;align-self:flex-end}
#refresh{align-self:flex-end}

.iad-workbench[data-page="industrial-images"] .grid {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
  gap: 10px 12px !important;
}
.iad-workbench[data-page="industrial-images"] .thumb {
  aspect-ratio: 4/3 !important;
  max-height: none !important;
}
.iad-workbench[data-page="industrial-images"] .pagination {
  margin-top: 10px !important;
  padding: 4px 0 2px !important;
}
`;var _g=`
dialog.iad-detail-dialog {text-align:left;}
.iad-dialog-form-layout {display:flex;flex-direction:column;flex:1 1 auto;min-height:0;}
.iad-dialog-body {flex:1 1 auto;min-height:0;overflow:auto;padding:18px 24px;font-size:var(--iad-font-size);color:var(--iad-text);}
.iad-dialog-footer {display:flex;align-items:center;justify-content:flex-end;flex:none;gap:10px;min-height:58px;padding:10px 24px;border-top:1px solid var(--iad-border);background:var(--iad-surface);}
/* ==========================================================================
   Dialog Design Tokens (Single Source of Truth)
   ========================================================================== */
:root {
  --iba-detail-dialog-height: var(--iad-dialog-max-height);
  --iba-detail-dialog-width: var(--iad-dialog-max-width);
  --iba-dialog-detail-width: var(--iad-dialog-max-width);
  --iba-dialog-edit-width: var(--iad-dialog-medium-width);
  --iba-dialog-max-height: var(--iad-dialog-max-height);
  --iba-dialog-gap: var(--iad-dialog-gutter);
  --iba-dialog-ink: var(--iad-text);
  --iba-dialog-border: var(--iad-border);
  --iba-dialog-font: var(--iad-font-family);

  --iad-modal-backdrop: rgba(23, 34, 51, 0.68);
  --iad-dialog-gutter: clamp(12px, 2.5vw, 32px);
  --iad-dialog-vgutter: clamp(12px, 2.5vw, 32px);

  /* Dimensions */
  --iad-dialog-max-width: 1380px;
  --iad-dialog-max-height: 820px;
  --iad-dialog-medium-width: 960px;
  --iad-dialog-small-width: 530px;

  /* Surfaces & Borders */
  --iad-dialog-bg: var(--iad-surface);
  --iad-dialog-radius: 7px;
  --iad-dialog-border: 1px solid #d9e2ed;
  --iad-dialog-shadow: 0 20px 64px rgba(14, 26, 48, 0.27);
  --iad-dialog-divider: 1px solid #e3e9f2;

  /* Typography */
  --iad-dialog-title-font: 17px;
  --iad-dialog-title-weight: 650;
  --iad-dialog-title-color: var(--iad-text);
  --iad-dialog-text-font: var(--iad-font-size);
  --iad-dialog-text-color: var(--iad-text);
  --iad-dialog-muted-color: var(--iad-muted);
}

@media (max-width: 850px) {
  :root {
    --iad-dialog-gutter: 18px;
    --iad-dialog-vgutter: 18px;
  }
}

@media (max-width: 560px) {
  :root {
    --iad-dialog-gutter: 12px;
    --iad-dialog-vgutter: 12px;
  }
}


.overlay:not(.show),
[hidden] {
  display: none !important;
}

/* ==========================================================================
   Base Dialog Container
   ========================================================================== */
.detail-dialog,
.exp-dialog,
.exp-direction-dialog,
.dc-dialog,
.dc-conflict-dialog,
dialog.iad-detail-dialog {
  box-sizing: border-box !important;
  background: var(--iad-dialog-bg) !important;
  border: var(--iad-dialog-border) !important;
  border-radius: var(--iad-dialog-radius) !important;
  box-shadow: var(--iad-dialog-shadow) !important;
  color: var(--iad-dialog-text-color) !important;
  font-family: inherit !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
  padding: 0 !important;
}

/* ==========================================================================
   Tier 1: Large Detail Dialogs (1380px max-width, 820px max-height)
   Image Detail, Exploration Direction Detail, Consistency Conflict Compare, Knowledge Detail
   ========================================================================== */
.detail-dialog,
.exp-direction-dialog,
.dc-conflict-dialog,
#knowledge-page .kb-v45 .detail-modal,
#knowledge-page .detail-modal,
.detail-modal,
dialog.iad-detail-dialog:not(.iad-drawer):not(.iad-dialog-compact):not(.iad-dialog-form):not(.iad-inline-dialog):not(.iad-viewer-dialog) {
  box-sizing: border-box !important;
  width: min(var(--iba-detail-dialog-width), calc(100vw - 2 * var(--iba-dialog-gap))) !important;
  max-width: var(--iba-detail-dialog-width) !important;
  height: min(var(--iba-detail-dialog-height), calc(100dvh - 2 * var(--iba-dialog-gap))) !important;
  max-height: min(var(--iba-detail-dialog-height), calc(100dvh - 2 * var(--iba-dialog-gap))) !important;
  min-height: 0 !important;
  border: 1px solid var(--iba-dialog-border) !important;
  border-radius: 7px !important;
  background: #fff !important;
  box-shadow: 0 20px 64px rgba(14, 26, 48, 0.27) !important;
  overflow: hidden !important;
  flex: none !important;
  display: flex !important;
  flex-direction: column !important;
}

dialog.iad-detail-dialog:not(.iad-drawer):not(.iad-inline-dialog):not(.iad-viewer-dialog) {
  position:fixed;
  inset:0;
  margin: auto !important;
}

/* Detail dialog internal scrollable body - scrolls only when needed */
.exp-direction-dialog .exp-dialog-main,
#dc-compare-mask .dc-dialog-body,
.dc-conflict-dialog .dc-dialog-body,
#knowledge-page .kb-v45 .detail-modal .modalcontent,
#knowledge-page .detail-modal .modalcontent,
.detail-modal .modalcontent {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
}

.detail-scroll{display:block;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:22px 28px 28px!important}
.exp-direction-dialog .exp-dialog-main { display:flex;flex-direction:column;padding:15px 28px 24px!important;flex:1 1 0!important;overflow:hidden!important; }
#dc-compare-mask .dc-dialog-body,
.dc-conflict-dialog .dc-dialog-body { padding: 20px 26px 24px !important; }

.exp-direction-dialog .exp-direction-body {
  display:grid;
  grid-template-columns:minmax(0,1fr);
  grid-template-rows:repeat(3,minmax(0,1fr)) minmax(230px,1fr);
  gap:0;
  flex:1 1 0;
  min-height:0;
  min-width:0;
}
.exp-direction-dialog .exp-direction-body h3 {font-size:13px;margin:0 0 10px}
.exp-direction-dialog .exp-direction-body>section {
  min-width:0;
  min-height:0;
  overflow:auto;
  overflow-wrap:anywhere;
  line-height:1.85;
  box-sizing:border-box;
  padding:16px 0;
}
.exp-direction-dialog .exp-direction-body>section:first-child{padding-top:0}
.exp-direction-dialog .exp-direction-body>section+section{border-top:1px solid var(--iad-border,#dbe2eb)}
.exp-direction-dialog .exp-direction-body p {margin:0;line-height:1.85}
.exp-direction-dialog .exp-direction-body ul {margin:0;padding-left:18px}
.exp-direction-dialog .exp-direction-body li+li {margin-top:6px}
.exp-direction-dialog .exp-direction-evidence {
  grid-column:1/-1;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  padding-bottom:0;
}
.exp-direction-dialog .exp-direction-evidence-head {flex:none;margin-bottom:12px}
.exp-direction-dialog .exp-direction-evidence-head h3 {margin:0}
.exp-direction-dialog .exp-direction-evidence-groups {
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:24px;
  flex:1 1 0;
  min-height:0;
}
.exp-direction-dialog .exp-scroll-group {display:flex;min-height:0;min-width:0;overflow:hidden}
.exp-direction-dialog .exp-scroll-group+.exp-scroll-group{border-left:1px solid var(--iad-border,#dbe2eb);padding-left:24px;box-sizing:border-box}
.exp-direction-dialog .exp-evidence-viewport {
  display:flex;
  flex:1 1 0;
  box-sizing:border-box;
  min-height:0;
  min-width:0;
  padding:3px 2px 8px;
  align-items:stretch;
  gap:10px;
  overflow-x:auto;
  overflow-y:hidden;
  scrollbar-width:thin;
  scroll-snap-type:x proximity;
}
.exp-direction-dialog .exp-evidence-viewport:focus-visible {outline:2px solid #2458d5;outline-offset:-2px}

.detail-preview {
  height: clamp(310px, 46dvh, 500px) !important;
}

/* ==========================================================================
   Tier 2: Medium Form & Analytics Dialogs (960px max-width, auto-height)
   Stats Modal, Exploration Prompts, Add/Edit Dataset, Knowledge Create
   ========================================================================== */
#knowledge-page .kb-v45 #create-overlay > .modal,
dialog.iad-detail-dialog.iad-dialog-form {
  width: min(var(--iba-dialog-edit-width), calc(100vw - 2 * var(--iba-dialog-gap))) !important;
  max-width: var(--iba-dialog-edit-width) !important;
  height: fit-content !important;
  max-height: min(var(--iba-dialog-max-height), calc(100dvh - 2 * var(--iba-dialog-gap))) !important;
  min-height: 0 !important;
  border-radius: 7px !important;
}

#knowledge-page .kb-v45 #create-overlay > .modal {
  height: fit-content !important;
}

#knowledge-page .kb-v45 #create-overlay > .modal > .modalcontent,
.dc-stats-dialog .dc-stats-body {
  padding: 22px 26px 24px !important;
  overflow-y: auto !important;
  flex: 0 1 auto !important;
  min-height: 0 !important;
}

/* ==========================================================================
   Tier 3: Small Confirmation / Deletion Dialogs (530px max-width, auto-height)
   Consistency Delete Job, Exploration Delete Job, Dataset Delete, Confirmations
   ========================================================================== */
dialog.iad-detail-dialog.iad-dialog-compact {
  width: min(var(--iad-dialog-small-width), calc(100vw - 32px)) !important;
  max-width: var(--iad-dialog-small-width) !important;
  height: fit-content !important;
  max-height: calc(100dvh - 32px) !important;
  min-height: 0 !important;
}

/* ==========================================================================
   Unified Headers
   ========================================================================== */
.exp-dialog-head,
.dc-dialog-head,
.iad-dialog-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  margin: 0 !important;
  min-height: 56px !important;
  height: 56px !important;
  flex: none !important;
  padding: 0 24px !important;
  border-bottom: var(--iad-dialog-divider) !important;
  background: var(--iad-dialog-bg) !important;
  box-sizing: border-box !important;
}

.exp-dialog-head strong,
.exp-dialog-head h2,
.dc-dialog-head h2,
.iad-dialog-header h2 {
  font-size: var(--iad-dialog-title-font) !important;
  font-weight: var(--iad-dialog-title-weight) !important;
  color: var(--iad-dialog-title-color) !important;
  line-height: 1.4 !important;
  margin: 0 !important;
  font-family: inherit !important;
}

/* Unified Close Button */

/* ==========================================================================
   Unified Footers & Actions
   ========================================================================== */
.exp-dialog-foot,
.dc-dialog-footer {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 10px !important;
  min-height: 58px !important;
  height: 58px !important;
  flex: none !important;
  padding: 0 24px !important;
  border-top: var(--iad-dialog-divider) !important;
  background: var(--iad-dialog-bg) !important;
  box-sizing: border-box !important;
  margin: 0 !important;
}

/* Unified Footer Buttons */
.exp-dialog-foot button,.dc-dialog-footer button,.iad-dialog-compact button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* ==========================================================================
   Dialog Typography and Status
   ========================================================================== */
.detail-dialog, .exp-dialog, .dc-dialog, #knowledge-page .kb-v45 .modal {
  font-family: var(--iba-dialog-font) !important;
  font-size: 13px !important;
  color: var(--iba-dialog-ink) !important;
}

.detail-dialog :is(.detail-scroll, .detail-footer),
.exp-dialog :is(.exp-dialog-head, .exp-dialog-main, .exp-dialog-foot),
.dc-dialog :is(.dc-dialog-head, .dc-dialog-body, .dc-dialog-footer),
#knowledge-page .kb-v45 .modal :is(.modalheader, .modalcontent, .modalfooter) {
  color: var(--iba-dialog-ink) !important;
}

/* Ordinary explanations/IDs/field labels: one ink, one size and regular weight.
   Exclude actual status badges and button contents from this normalization. */
:is(.detail-dialog, .exp-dialog, .dc-dialog, #knowledge-page .kb-v45 .modal)
:is(p, span, small, label, dt, dd, li, figcaption, pre)
:not(:is(button, button *, a, a *, .exp-pill, .exp-pill *, .status, .status *, .dc-state, .dc-state *, .badge, .badge *, .dc-tag, .dc-tag *)) {
  color: var(--iba-dialog-ink) !important;
  font-family: var(--iba-dialog-font) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
}

/* Unify ordinary inline metadata found in each detail implementation. */
.exp-direction-dialog :is(.exp-direction-meta, .exp-direction-meta *, .exp-direction-note),
.detail-dialog :is(.detail-meta, .detail-info, .detail-summary),
.dc-dialog :is(.dc-dialog-caption, .dc-dialog-note, .dc-verdict-description),
#knowledge-page .kb-v45 .detail-modal :is(.muted, .row-desc, .detail-muted, .detail-evidence-empty) {
  color: var(--iba-dialog-ink) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
}

/* Titles are the only deliberately bold non-state text. */
:is(.detail-dialog, .exp-dialog, .dc-dialog, #knowledge-page .kb-v45 .modal)
:is(h1, h2, h3, h4),
.exp-dialog .exp-dialog-head > strong,
.dc-dialog .dc-dialog-title {
  font-family: var(--iba-dialog-font) !important;
  color: var(--iba-dialog-ink) !important;
  font-weight: 650 !important;
}

/* Preserve semantic status colors; primary/selected controls keep their function-based color. */
.exp-dialog :is(.exp-pill.ok, .exp-pill.completed) { color: #177b53 !important; }
.exp-dialog :is(.exp-pill.fail, .exp-pill.failed) { color: #b23c43 !important; }
.exp-dialog :is(.exp-pill.pending, .exp-pill.running) { color: #285ed6 !important; }
#knowledge-page .kb-v45 .modal .status.green { color: #177b53 !important; }
#knowledge-page .kb-v45 .modal .status.red { color: #b23c43 !important; }
#knowledge-page .kb-v45 .modal .status.amber { color: #976013 !important; }
#knowledge-page .kb-v45 .modal .status.blue { color: #285ed6 !important; }



@keyframes exp-drawer-enter {
  from {
    transform: translateX(24px);
    opacity: 0.7;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}


dialog.iad-drawer{--iad-dialog-radius:0px;--iad-dialog-border:0;--iad-dialog-shadow:-12px 0 28px rgba(17,28,45,.1)}
dialog.iad-drawer::backdrop{background:rgba(17,28,45,.49)}
dialog.iad-drawer>.iad-dialog-header{height:64px!important;min-height:64px!important}
`;var Cg=`
/* ==========================================================================
   V51 Unified Design Tokens (Single Source of Truth)
   ========================================================================== */
:root {
  --iba-field-width: var(--iad-field-width);
  --iba-field-height: var(--iad-control-height);
  --iba-parent-dataset-width: var(--iad-dataset-width);
  --iba-child-dataset-width: var(--iad-subset-width);
  --iba-filter-gap: var(--iad-space-3);
  --iba-unified-font: var(--iad-font-family);
  --iba-unified-ink: var(--iad-text);
  --iba-unified-body-size: var(--iad-font-size);
  --iba-control-font: var(--iad-font-size);
  --iba-border: var(--iad-control-border);
  --iba-radius: var(--iad-radius);
  --iba-primary: var(--iad-primary-fill);
  --iba-primary-hover: var(--iad-primary-hover);
}

/* Global font family application */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon) {
  font-family: var(--iba-unified-font) !important;
}

/* Unified body font size (13px), ink color (#172338), and normal weight (400) */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  p, li, td, th, label, legend, small, summary, dt, dd, figcaption, time, pre, blockquote, textarea, select, input,
  .nav-label, .eyebrow, .row-desc, .page-total, .pagination-page, .pagination-total,
  .exp-row-info, .exp-lead, .exp-input, .exp-prompt-note, .exp-brief, .exp-summary, .exp-row-title,
  .exp-job-time, .exp-job-duration, .exp-job-dataset, .exp-job-dataset-name,
  .dc-muted, .dc-note, .dc-mono, .dc-time, .dc-elapsed, .detail-model-text, .detail-model-result,
  .hint, .subtitle, .muted, .smallhint, .note, .sidecaption, .context-info, .row-count, .jobtitle, .job-meta, .job-desc
),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) span:not(:where(
  .status, .exp-pill, .dc-state, .badge, .tag, [class*="status"], [class*="state"], [class*="pill"], [class*="badge"], [class*="tag"],
  .brand-symbol, .nav-icon, .exp-step b, .exp-phase b, .exp-state,
  [class*="status"] *, [class*="state"] *, [class*="pill"] *, [class*="badge"] *, button *, [role="button"] *
)),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) div:not(:has(*)):not(:where(
  .brand-symbol, .nav-icon, .status, [class*="state"], [class*="status"], [class*="pill"], [class*="badge"]
)) {
  font-size: var(--iba-unified-body-size, 13px) !important;
  color: var(--iba-unified-ink) !important;
}

/* Form controls default font size */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(button, input, select, textarea) {
  font-size: 13px !important;
}

/* ==========================================================================
   V51 Primary Buttons (Height 38px, font 13px, white text)
   ========================================================================== */

/* ==========================================================================
   V51 Unified Filter Bars & Controls (220x38px, 12px gap, left aligned)
   ========================================================================== */
:is(#images-page .filter-bar, .filter-bar, .kb-v45 .filterset, .exp-job-list-actions, .dc-refined-filterbar, .iad-manager-search-wrap) {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: var(--iba-filter-gap) !important;
  align-items: flex-end !important;
  justify-content: flex-start !important;
  min-width: 0 !important;
}

/* Search and select field containers: 220px fixed width */
:is(.filter-bar .filter-item, .dc-refined-filterbar .dc-filter-field, .dc-refined-filterbar .dc-search-field, .iad-manager-search-wrap #search, #search.search, .iad-dataset-page-wrap #search) {
  flex: 0 0 var(--iba-field-width) !important;
  width: var(--iba-field-width) !important;
  min-width: 0 !important;
  max-width: var(--iba-field-width) !important;
  box-sizing: border-box !important;
}

/* Controls inside fixed-width fields fill their owner; direct flex controls retain their declared width. */
:is(.filter-bar .filter-item input, .filter-bar .filter-item select,
    .dc-results-section .dc-refined-filterbar input, .dc-results-section .dc-refined-filterbar select,
    .iad-dataset-page-wrap #search) {width:100% !important;}

/* All search inputs & select elements */
:is(.filter-bar .filter-item input, .filter-bar .filter-item select,
    .dc-results-section .dc-refined-filterbar input, .dc-results-section .dc-refined-filterbar select,
    .iad-dataset-page-wrap #search) {
  display: block !important;
  height: var(--iba-field-height) !important;
  min-height: var(--iba-field-height) !important;
  max-height: var(--iba-field-height) !important;
  box-sizing: border-box !important;
  border: 1px solid var(--iba-border) !important;
  border-radius: var(--iba-radius) !important;
  background: #fff !important;
  font-family: var(--iba-unified-font) !important;
  font-size: var(--iba-control-font) !important;
  font-weight: 400 !important;
  color: var(--iba-unified-ink) !important;
  line-height: normal !important;
  box-shadow: none !important;
  padding: 0 11px !important;
}

/* Field labels */
:is(.filter-bar .filter-item label, .dc-refined-filterbar .dc-filter-field, .exp-job-list-actions .exp-filter-control, .kb-v45 .filterset label) {
  font-family: var(--iba-unified-font) !important;
  font-size: var(--iba-control-font) !important;
  font-weight: 400 !important;
  color: var(--iba-unified-ink) !important;
}

/* Focus states */
:is(.filter-bar .filter-item input:focus, .filter-bar .filter-item select:focus,
    .dc-refined-filterbar input:focus, .dc-refined-filterbar select:focus,
    .exp-job-list-actions input:focus, .exp-job-list-actions select:focus,
    .kb-v45 .filterset > .f:focus,
    .iad-dataset-page-wrap #search:focus) {
  border-color: var(--iba-primary) !important;
  outline: 2px solid #b4c8ff !important;
  outline-offset: 0 !important;
}

/* ==========================================================================
   V51 Clear Filter & Refresh Icon Buttons (38x38px)
   ========================================================================== */
.iba-filter-clear, .iba-refresh-icon {
  align-self: flex-end !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}
#images-page #reset, #images-page #refresh {
  align-self: flex-end !important;
}

.kb-v45 .filterset > .f {
  margin: 0 !important;
}
.exp-job-list-actions {
  align-items: center !important;
}
.exp-job-list-actions .exp-filter-control {
  display: flex;
  justify-content: flex-end;
  margin: 0 !important;
}
.exp-job-list-actions .iba-filter-clear {
  align-self: center !important;
}
.dc-results-section .dc-refined-filterbar {
  justify-content: flex-start !important;
}
.dc-results-section .dc-refined-filterbar .dc-filter-field,
.dc-results-section .dc-refined-filterbar .dc-search-field {
  order: 0 !important;
  flex: 0 0 var(--iba-field-width) !important;
  width: var(--iba-field-width) !important;
  max-width: var(--iba-field-width) !important;
  min-width: 0 !important;
}
.dc-results-section .dc-refined-filterbar .iba-filter-clear {
  order: 5 !important;
}

/* ==========================================================================
   V51 Dataset Scope Selector (Parent: 250px, Child: 390px, height: 38px)
   ========================================================================== */
:is(#images-page .dataset-panel .parent, .dc-scope .dc-parent, .exp-scope .exp-parent-controls, .kb-v45 .context .control:first-child) {
  flex: 0 1 var(--iba-parent-dataset-width) !important;
  width: var(--iba-parent-dataset-width) !important;
  min-width: 210px !important;
  max-width: var(--iba-parent-dataset-width) !important;
}
:is(#images-page .dataset-panel .child, .dc-scope .dc-children, .exp-scope .exp-child-wrap, .kb-v45 .context .control:nth-child(2)) {
  flex: 0 1 var(--iba-child-dataset-width) !important;
  width: var(--iba-child-dataset-width) !important;
  min-width: 230px !important;
  max-width: var(--iba-child-dataset-width) !important;
}
:is(.kb-v45 .context .control select, .dc-scope .dc-parent select, .exp-scope .exp-select, .exp-scope .exp-child-button, .dc-scope .dc-multi-trigger, #images-page .dataset-panel select, #images-page .dataset-panel .dataset-multi-trigger) {
  height: 38px !important;
  min-height: 38px !important;
  font: 400 13px var(--iba-unified-font) !important;
  color: var(--iba-unified-ink) !important;
  border-color: var(--iba-border) !important;
  border-radius: 5px !important;
  box-sizing: border-box !important;
}
:is(.kb-v45 .context .control label, .exp-scope .exp-input, .dc-scope .dc-parent label, .dc-scope .dc-children label, #images-page .dataset-panel label) {
  font: 400 13px var(--iba-unified-font) !important;
  color: var(--iba-unified-ink) !important;
}
.exp-scope-refresh, .dc-scope .dc-child-controls .dc-icn {
  align-self: flex-end !important;
}
.kb-v45 .context .kb-context-actions {
  align-self: flex-end !important;
}

/* ==========================================================================
   V51 Ordinary Data Text & Status Semantic Colors
   ========================================================================== */
:is(.exp-job-table .exp-row-title, .exp-job-dataset, .exp-job-dataset *,
    .kb-v45 .jobtitle, .kb-v45 .knowledge-entry-name, .kb-v45 .knowledge-entry-description,
    .dc-table .dc-mono, .dc-table .dc-job-datasets,
    #images-page .card-name, .exp-job-table td:not(:has(.exp-pill)), .dc-table td:not(:has(.exp-pill)):not(:has(.dc-state)),
    .kb-v45 .jobs-table td, .kb-v45 .knowledge-row, .name-text) {
  font-family: var(--iba-unified-font) !important;
  font-weight: 400 !important;
  color: var(--iba-unified-ink) !important;
  font-size: 13px !important;
}

/* Status pills retain their established semantic status colors and subtle backgrounds */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill, .dc-state.exp-pill
) {
  display: inline-block !important;
  border-radius: 4px !important;
  padding: 3px 8px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.ok, .exp-pill.completed, .dc-state.ok, .dc-state.completed, .kb-v45 .status.green, .status.ok, .status.green
) {
  color: #177b53 !important;
  background-color: #e8f5ee !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.fail, .exp-pill.failed, .dc-state.fail, .dc-state.failed, .kb-v45 .status.red, .status.fail, .status.red
) {
  color: #b23c43 !important;
  background-color: #ffedf0 !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.running, .dc-state.running, .kb-v45 .status.blue, .status.running
) {
  color: #285ed6 !important;
  background-color: #e9f0ff !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.pending, .dc-state.pending, .kb-v45 .status.amber, .status.pending
) {
  color: #8e6d24 !important;
  background-color: #fff5df !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .status.gray, .exp-pill.draft, .kb-v45 .status.gray
) {
  color: #526174 !important;
  background-color: #eef2f7 !important;
}

/* Table headers & structural labels: bold and dark (#172338) */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(th, .knowledge-head > span, .nav-label) {
  font-weight: 600 !important;
  color: var(--iba-unified-ink) !important;
}

/* Secondary auxiliary texts: normal weight 400 */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-job-dataset-children, .exp-row-info, .exp-lead, .row-desc, .exp-prompt-note,
  .pagination-total, .pagination-page, .page-total, .eyebrow
) {
  font-weight: 400 !important;
}

/* Secondary action buttons & links use body ink */

/* Placeholders */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(input, textarea)::placeholder {
  color: var(--iba-unified-ink) !important;
  opacity: 0.65 !important;
}

/* ==========================================================================
   V51 Responsive Layout for Narrow Viewports
   ========================================================================== */
@media (max-width: 820px) {
  :is(.filter-bar .filter-item, .dc-results-section .dc-refined-filterbar .dc-filter-field, .exp-job-list-actions .exp-filter-control, .kb-v45 .filterset > .f) {
    flex: 1 1 180px !important;
    width: auto !important;
    max-width: none !important;
  }
  :is(.kb-v45 .context .control:first-child, .kb-v45 .context .control:nth-child(2)) {
    flex: 1 1 240px !important;
    width: auto !important;
    max-width: none !important;
  }
}
`;var Ng=`#audit-page { --audit-ink:#172338; --audit-border:#dbe2eb; --audit-blue:#285ed6; --audit-bg:#fff; color:var(--audit-ink); font:13px/1.5 system-ui,"Microsoft YaHei","PingFang SC",sans-serif; padding:0 0 64px; min-width:0; }
#audit-page[hidden] {display:none!important}
#audit-page *,#audit-page *::before,#audit-page *::after{box-sizing:border-box}
#audit-page input,#audit-page select,#audit-page textarea{font-family:inherit;font-size:13px}
#audit-page h2:not(.iad-section-title){font-size:16px;line-height:1.5;font-weight:700;margin:0;color:var(--audit-ink)}
#audit-page h3{font-size:14px;line-height:1.5;font-weight:700;margin:0;color:var(--audit-ink)}
#audit-page p{margin:0}
#audit-page .audit-field{display:grid;gap:7px;min-width:0;position:relative;color:var(--audit-ink)}
#audit-page .audit-field>span{font-size:13px;font-weight:400;color:var(--audit-ink)}
#audit-page .audit-field input,#audit-page .audit-field textarea,#audit-page .audit-child-trigger{height:38px;border:1px solid #b7c5d9;border-radius:5px;background:#fff;color:var(--audit-ink);padding:0 12px;outline:none;box-shadow:none}
#audit-page .audit-field input:focus-visible,#audit-page .audit-field textarea:focus-visible,#audit-page .audit-child-trigger:focus-visible{border-color:var(--audit-blue);outline:2px solid #b4c8ff;outline-offset:1px}
#audit-page .audit-scope .field.parent{width:250px}
#audit-page .audit-scope .field.child{width:390px}
#audit-page .audit-child-trigger{width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
#audit-page .audit-child-popover{position:absolute;z-index:80;top:calc(100% + 4px);width:100%;max-height:240px;overflow:auto;background:white;border:1px solid var(--audit-border);border-radius:5px;box-shadow:0 10px 24px #1c31551c;padding:5px}
#audit-page .audit-child-popover[hidden]{display:none!important}
#audit-page .audit-child-popover label{display:flex;align-items:center;gap:9px;padding:9px 10px;cursor:pointer;min-width:0}
#audit-page .audit-child-popover label:hover{background:#f2f6fd}
#audit-page .audit-child-popover input{accent-color:var(--audit-blue)}
#audit-page .audit-panel{border:1px solid var(--audit-border);background:#fff;border-radius:6px;margin-bottom:var(--iad-layout-gap);min-width:0;overflow:hidden}
#audit-page .audit-panel-head{min-height:66px;padding:17px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-bottom:1px solid var(--audit-border)}
#audit-page .audit-panel-head.audit-compact-head{border-bottom:0;padding-bottom:14px}
#audit-page .audit-filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#audit-page .audit-filters .audit-field{width:220px}
#audit-page .iad-section-heading .audit-field{display:flex;flex-direction:row;align-items:center;gap:8px;width:auto}
#audit-page .iad-section-heading .audit-field>span{white-space:nowrap}
#audit-page .audit-tabs{margin:0 0 var(--iad-layout-gap)}
#audit-page .audit-scroll-table{overflow-x:auto;max-width:100%}
#audit-page .audit-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px;color:var(--audit-ink)}
#audit-page .audit-table thead{background:#f1f4f9}
#audit-page .audit-table th{font-weight:400;text-align:left;border-bottom:1px solid var(--audit-border);font-size:13px;white-space:nowrap;color:var(--audit-ink)}
#audit-page .audit-table td{border-bottom:1px solid #e6ebf1;color:var(--audit-ink);font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#audit-page .audit-table:not(.iad-job-table-grid) th{padding:13px 17px}
#audit-page .audit-table:not(.iad-job-table-grid) td{padding:16px 17px}
#audit-page .audit-table tr:last-child td{border-bottom:0}
#audit-page .audit-table tbody tr[data-run-id]{cursor:pointer}
#audit-page .audit-table tbody tr[data-run-id]:hover{background:#f7faff}
#audit-page .audit-table tbody tr[aria-selected="true"]{background:#eaf0ff;box-shadow:inset 3px 0 var(--audit-blue)}
#audit-page .audit-table .audit-ops{text-align:right}
#audit-page .audit-status{display:inline-flex;align-items:center;border-radius:4px;padding:3px 8px;font-weight:700;font-size:12px;line-height:1.5;white-space:nowrap}
#audit-page .audit-status.done{background:#e8f5ee;color:#177b53}
#audit-page .audit-status.active{background:#eaf0ff;color:#285ed6}
#audit-page .audit-status.warn{background:#fff1df;color:#975d0f}
#audit-page .audit-status.failed{background:#fdecef;color:#a83142}
#audit-page .audit-status.neutral{background:#eef2f7;color:#43546f}
#audit-page .audit-pagination{display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:8px;padding:12px 20px;border-top:1px solid #e6ebf1;min-height:60px}
#audit-page .audit-pagination button{height:32px;min-width:32px;padding:0 10px;border:1px solid var(--audit-border);background:#fff;border-radius:5px;color:var(--audit-ink)}
#audit-page .audit-pagination button[aria-current="page"]{background:var(--audit-blue);color:#fff;border-color:var(--audit-blue);font-weight:700}
#audit-page .audit-pagination .audit-total{margin-left:6px;color:var(--audit-ink)}
#audit-page .audit-empty{min-height:106px;display:flex;align-items:center;justify-content:center;padding:24px;color:var(--audit-ink)}
#audit-page .audit-image-section{overflow:visible}
#audit-page .audit-image-tools{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid var(--audit-border)}
#audit-page .audit-image-search{display:flex;align-items:center;gap:8px}
#audit-page .audit-image-search input{width:220px;height:38px;border:1px solid #b7c5d9;border-radius:5px;padding:0 12px;background:#fff;color:var(--audit-ink)}
#audit-page .audit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(174px,1fr));gap:14px;padding:20px}
#audit-page .audit-image-card{min-width:0;padding:0;text-align:left;border:1px solid #dbe2eb;background:#fff;border-radius:5px;overflow:hidden;color:var(--audit-ink);box-shadow:none}
#audit-page .audit-image-card:hover,#audit-page .audit-image-card:focus-visible{border-color:var(--audit-blue);outline:none}
#audit-page .audit-thumb{height:148px;background:#f0f4f9;display:flex;align-items:center;justify-content:center}
#audit-page .audit-thumb img{width:100%;height:100%;object-fit:contain}
#audit-page .audit-image-name{padding:9px 11px 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:400;color:var(--audit-ink)}
#audit-page .audit-card-meta{display:flex;justify-content:space-between;gap:6px;align-items:center;padding:2px 11px 11px}
#audit-page .audit-card-meta .audit-status{font-weight:700}
#audit-page .audit-summary-area{padding:21px 22px 25px}
#audit-page .audit-report-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid var(--audit-border);border-radius:5px;margin-bottom:23px;overflow:hidden}
#audit-page .audit-kpi{padding:17px 15px;border-right:1px solid var(--audit-border)}
#audit-page .audit-kpi:last-child{border-right:0}
#audit-page .audit-kpi strong{display:block;font-size:23px;font-weight:700;margin:5px 0 0;color:var(--audit-ink)}
#audit-page .audit-report-columns{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:24px}
#audit-page .audit-report-block{border-top:1px solid var(--audit-border);padding-top:18px;margin-top:16px}
#audit-page .audit-report-block h3{margin-bottom:9px}
#audit-page .audit-report-block p{margin:7px 0;line-height:1.85}
#audit-page .audit-evidence-list{display:grid;gap:9px;margin-top:14px}
#audit-page .audit-evidence-link{display:grid;grid-template-columns:100px minmax(0,1fr);align-items:center;gap:13px;text-align:left;min-width:0;background:#fff;border:1px solid var(--audit-border);border-radius:5px;padding:7px;color:var(--audit-ink)}
#audit-page .audit-evidence-link:hover{background:#f7faff}
#audit-page .audit-evidence-link img{width:100px;height:66px;object-fit:contain;background:#f0f4f9}
#audit-page .audit-evidence-link span{min-width:0;line-height:1.7}
#audit-page .audit-disclaimer{margin-top:20px;color:var(--audit-ink);font-size:13px}
#audit-page .audit-create-page{display:grid;gap:16px;min-width:0}
#audit-page .audit-source-panel{margin:0;min-width:0}
#audit-page .audit-source-panel .audit-panel-head{padding:16px 20px}
#audit-page .audit-source-panel .audit-panel-head h2{font-size:16px}
#audit-page .audit-source-table{width:100%;overflow:auto;max-height:350px;scrollbar-width:thin}
#audit-page .audit-source-table .audit-table{font-size:13px;min-width:720px;table-layout:fixed}
#audit-create-consistency-jobs .audit-source-table .audit-table{min-width:900px}
#audit-page .audit-source-table th{position:sticky;top:0;z-index:1;background:#f1f4f9}
#audit-page .audit-source-table .audit-table :is(th,td){padding:11px 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#audit-page .audit-source-table .audit-table .audit-description{white-space:normal;line-height:1.6;overflow-wrap:anywhere}
#audit-page .audit-source-table input{width:16px;height:16px;accent-color:var(--audit-blue);cursor:pointer}
#audit-page .audit-entry-row{cursor:pointer}
#audit-page .audit-entry-title{border:0;background:none;padding:0;color:var(--iad-primary);font:inherit;text-align:left;cursor:pointer;white-space:normal;overflow-wrap:anywhere}
#audit-page .audit-entry-area{border-top:1px solid var(--audit-border)}
#audit-page .audit-entry-header{padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
#audit-page .audit-entry-header h3{font-size:15px;margin:0}
#audit-page .audit-pick-all{display:inline-flex;align-items:center;gap:7px;font-size:13px;cursor:pointer}
#audit-page .audit-pick-all input{width:16px;height:16px;accent-color:var(--audit-blue)}
#audit-page .audit-create-confirm{padding:20px;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
#audit-page .audit-source-panel>.iad-agent-prompts{padding:20px}
#audit-page .audit-create-facts{display:grid;grid-template-columns:minmax(0,1fr);gap:7px;margin:0;min-width:0;flex:1 1 500px}
#audit-page .audit-create-facts>div{display:grid;grid-template-columns:95px minmax(0,1fr);gap:12px;line-height:1.75}
#audit-page .audit-create-facts dd{margin:0;overflow-wrap:anywhere;max-width:720px}
#audit-page .audit-create-actions{display:flex;align-items:center;gap:10px;margin-left:auto}
#audit-page .audit-create-actions button{min-width:100px}
#audit-page .audit-source-error{padding:0 20px 16px;margin:0}

#audit-page .audit-overlay{position:fixed;inset:0;z-index:310;display:flex;align-items:center;justify-content:center;background:#17243ab8;padding:30px}
#audit-page .audit-overlay[hidden]{display:none!important}
#audit-page dialog.audit-dialog{margin:auto!important;width:min(1380px,calc(100vw - 60px));height:min(820px,calc(100dvh - 60px));background:#fff;border:1px solid var(--audit-border);border-radius:7px;box-shadow:0 20px 65px #15233e42;display:flex;flex-direction:column;min-height:0;overflow:hidden;color:var(--audit-ink)}
#audit-page .audit-dialog-head{height:66px;flex:none;padding:0 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--audit-border)}
#audit-page .audit-dialog-head h2{font-size:17px}
#audit-page .audit-dialog-body{flex:1;min-height:0;overflow:auto;padding:22px 24px 26px}
#audit-page .audit-analysis-sections>section{padding:0 0 18px;margin:0 0 19px;border-bottom:1px solid var(--audit-border);min-width:0}
#audit-page .audit-analysis-sections>section:last-child{border:0;margin-bottom:0;padding-bottom:0}
#audit-page .audit-analysis-sections h3{font-weight:700;font-size:15px;margin:0 0 12px}
#audit-page .audit-analysis-sections p{font-size:13px;line-height:1.85;white-space:pre-wrap;overflow-wrap:anywhere}
#audit-page .audit-dialog-foot{border-top:1px solid var(--audit-border);min-height:58px;display:flex;align-items:center;justify-content:flex-end;gap:9px;padding:10px 24px}
#audit-page .audit-lightbox{position:fixed;inset:0;z-index:350;background:#111b2fe8;display:flex;align-items:center;justify-content:center;padding:60px 75px}
#audit-page .audit-lightbox[hidden]{display:none!important}
#audit-page .audit-lightbox img{max-width:100%;max-height:100%;object-fit:contain}
#audit-page .audit-lightbox button{position:absolute;width:45px}
#audit-page .audit-lightbox .close{right:26px;top:24px}
#audit-page .audit-lightbox .prev{left:24px;top:50%}
#audit-page .audit-lightbox .next{right:24px;top:50%}
#audit-page .audit-lightbox .caption{position:absolute;bottom:20px;left:20px;right:20px;text-align:center;color:#fff;font-size:13px}
@media(max-width:1100px){#audit-page .audit-report-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}#audit-page .audit-kpi:nth-child(3){border-right:0}#audit-page .audit-kpi:nth-child(n+4){border-top:1px solid var(--audit-border)}}
@media(max-width:780px){#audit-page{padding:0 0 40px}#audit-page .audit-scope-parent,#audit-page .audit-scope-child{width:100%}#audit-page .audit-report-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#audit-page .audit-kpi{border-top:1px solid var(--audit-border)}#audit-page .audit-report-columns{grid-template-columns:1fr}#audit-page .audit-overlay{padding:12px}#audit-page .audit-dialog{width:calc(100vw - 24px);height:calc(100dvh - 24px)}#audit-page .audit-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:9px;padding:12px}#audit-page .audit-thumb{height:122px}#audit-page .audit-dialog-body{padding:16px}}`;var zg=`
.iad-image-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.iad-image-pair-side{min-width:0}.iad-image-pair-side>p{margin-bottom:8px;color:var(--iad-muted)}

.iad-thumbnail-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:10px 12px;align-content:start;align-items:start}
button.iad-thumbnail-card{display:flex;flex-direction:column;align-items:stretch;width:100%;max-width:192px;min-width:0;flex:0 0 180px;align-self:start;height:168px;max-height:100%;padding:8px;box-sizing:border-box;background:var(--iad-surface,#fff);color:var(--iad-text,#172338);border:1px solid var(--iad-control-border,#a7b8d1);border-radius:5px;text-align:left;white-space:normal;overflow:hidden;cursor:pointer;font:inherit}
button.iad-thumbnail-card:hover{border-color:var(--iad-primary,#2458d5);background:var(--iad-surface,#fff)}
button.iad-thumbnail-card:focus-visible,button.iad-thumbnail-card[data-focused=true],button.iad-thumbnail-card[data-highlighted=true],button.iad-thumbnail-card[aria-pressed=true]{outline:2px solid var(--iad-primary,#2458d5);outline-offset:1px}
.iad-thumbnail-card>.iad-thumbnail-media{display:flex;align-items:center;justify-content:center;width:100%;height:128px;min-height:0;overflow:hidden;background:var(--iad-surface-muted,#eef2f7);position:relative;flex:1 1 128px;padding:0}
.iad-thumbnail-card>.iad-thumbnail-media>img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain}
button.iad-thumbnail-card[data-variant=evidence]{max-width:none;height:auto;padding:0;flex:none;border:0;border-radius:0;background:transparent}
.iad-thumbnail-card[data-variant=evidence]>.iad-thumbnail-media{height:300px;flex:none;border:1px solid var(--iad-border);border-radius:4px;background:#f0f4f9}
.iad-thumbnail-card[data-variant=evidence]>.iad-thumbnail-caption{white-space:normal;overflow-wrap:anywhere;font-size:var(--iad-font-size);margin-top:9px;padding:0;line-height:1.6}
@media(max-width:750px){.iad-thumbnail-card[data-variant=evidence]>.iad-thumbnail-media{height:235px}}
.iad-thumbnail-strip{display:flex;flex:none;gap:12px;overflow-x:auto;max-width:100%;min-height:0;padding:3px 2px 8px}
.iad-thumbnail-card>.iad-thumbnail-caption{display:block;min-width:0;padding:6px 0 2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:12px;font-weight:400;color:inherit;line-height:18px}
.iad-thumbnail-card>small,.iad-thumbnail-card>.iad-thumbnail-meta{display:block;font-size:12px;line-height:18px;color:var(--iad-muted,#687990)}
button.iad-thumbnail-card[data-variant=comparison]{max-width:none;height:auto;max-height:none;padding:0;border-color:var(--iad-border);border-radius:7px;flex:none}
.iad-thumbnail-card[data-variant=comparison]>.iad-thumbnail-media{height:140px;flex:none}
.iad-thumbnail-card[data-variant=comparison]>.iad-thumbnail-caption{padding:7px 9px 4px;font-weight:600}
.iad-thumbnail-values{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;padding:0 9px 8px;line-height:18px}
.iad-thumbnail-values>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.iad-thumbnail-values>span:last-child{text-align:right}
button.iad-thumbnail-card[data-variant=compact]{width:94px;max-width:none;height:70px;max-height:none;flex:0 0 94px;padding:0;border:2px solid transparent}
.iad-thumbnail-card[data-variant=compact]>.iad-thumbnail-media{height:100%;flex:none}
.iad-thumbnail-card[data-variant=compact]>.iad-thumbnail-caption{display:none}
.iad-thumbnail-strip:has(>[data-variant=compact]){gap:9px;padding:6px 2px 8px;margin:10px 0 8px;scrollbar-width:thin}
nav.iad-pagination{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;padding:4px 0 2px;margin:10px 0 0;font-size:12px;color:var(--iad-text,#172338)}
nav.iad-pagination>button{height:32px;min-height:32px;min-width:32px;padding:0 8px;border:1px solid var(--iad-control-border,#dbe2eb);border-radius:5px;background:var(--iad-surface,#fff);color:inherit;cursor:pointer;font-size:12px;font-weight:400;line-height:normal;box-shadow:none}
nav.iad-pagination>button:disabled{opacity:.4;cursor:not-allowed}
nav.iad-pagination>button:not(:disabled):hover{background:var(--iad-hover,#eef4ff);border-color:var(--iad-primary,#2458d5)}
nav.iad-pagination>button[aria-current=page]{background:var(--iad-primary,#2458d5);border-color:var(--iad-primary,#2458d5);color:#fff}
nav.iad-pagination>span{white-space:nowrap;margin-left:4px}
dialog.iad-fullscreen-dialog{width:100vw;height:100dvh;max-width:none;max-height:none;padding:0;margin:0;border:0;border-radius:0;background:#202a36;overflow:hidden}
dialog.iad-fullscreen-dialog .full-overlay{position:absolute;inset:0}
.full-image-world>.iad-annotation-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.iad-annotation-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden}
.iad-annotation-layer :is(rect,polygon){fill:none;stroke:#ffb74c;stroke-width:2;vector-effect:non-scaling-stroke}
.iad-annotation-layer text{fill:#fff;stroke:#152538;stroke-width:3;paint-order:stroke;font-size:12px}
.iad-annotation-layer .iad-annotation-mask>g>rect{fill:#ffb74c;fill-opacity:.45;stroke:none}
.full-content{display:flex;flex:1;min-height:0;min-width:0}.full-context{width:288px;min-width:0;overflow:auto;background:var(--iad-surface,#fff);padding:16px;color:var(--iad-text,#172338)}.full-context .iad-thumbnail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
`;var Rg=`
.iad-section-heading{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px var(--iad-layout-inline-gap);min-height:var(--iad-layout-section-height);padding:8px var(--iad-layout-section-inset);margin:0;border-bottom:1px solid var(--iad-section-border);background:var(--iad-surface)}
.iad-section-heading>h2{font-size:16px;font-weight:650;line-height:24px;letter-spacing:0;color:var(--iad-text);margin:0;padding:0}
.iad-section-actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:10px 16px;margin-left:auto;min-width:0}
`;var Pg=`
.iad-workbench.iad-business-page{width:100%;max-width:none;margin-inline:0;padding:var(--iad-layout-top) var(--iad-layout-inset) var(--iad-layout-bottom)}
.iad-business-page .iad-header{display:flex;align-items:center;justify-content:space-between;gap:var(--iad-layout-inline-gap);min-height:var(--iad-layout-title-height);margin:0 0 var(--iad-layout-gap)}
.iad-business-page .iad-header h1{margin:0;padding:0;color:var(--iad-text);font-size:24px;font-weight:670;line-height:1.35;letter-spacing:-.4px}
`;var Lg=`
.iad-report-body{padding:24px;display:grid;gap:22px;min-width:0}
.iad-report-section{min-width:0;display:grid;gap:12px}
.iad-report-section p{white-space:pre-wrap;line-height:1.85;overflow-wrap:anywhere}
.iad-workbench .iad-report-data{margin:0;display:grid;grid-template-columns:minmax(0,1fr);gap:9px}
.iad-report-data>div{display:grid;grid-template-columns:105px minmax(0,1fr);gap:14px;min-width:0}
.iad-report-data dt,.iad-report-data dd{margin:0;overflow-wrap:anywhere}
.iad-dataset-report .iad-thumbnail-grid>div{min-width:0;display:grid;justify-items:start;gap:8px}
@media(max-width:600px){.iad-report-body{padding:16px}}

.iad-audit-document{--iba-unified-body-size:14px;width:100%;min-width:0;color:var(--audit-ink,#172338);background:#fff;font-size:14px;line-height:1.85}
#audit-page .iad-audit-document h1{font-size:28px;line-height:1.45;margin:0 0 10px;font-weight:700}
#audit-page .iad-audit-document h2{font-size:24px;line-height:1.5;margin:0 0 16px;font-weight:700}
#audit-page .iad-audit-document h3{font-size:18px;line-height:1.55;margin:18px 0 0;font-weight:650}
#audit-page .iad-audit-document h4{font-size:14px;line-height:1.6;margin:0;font-weight:650}
#audit-page .iad-audit-document p{font-size:14px;line-height:1.9;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.iad-audit-report-intro{display:grid;gap:10px;padding:2px 0 28px}
.iad-audit-report-meta{--iba-unified-body-size:13px;--iba-unified-ink:var(--text-secondary,#536174);display:flex;flex-wrap:wrap;gap:8px 24px;color:var(--text-secondary,#536174);font-size:13px}
.iad-audit-document>.iad-report-section{display:grid;gap:14px;border-top:1px solid var(--audit-border,#dbe2eb);padding:30px 0}
#audit-page .iad-dataset-report>.audit-panel-head{border-bottom:0;background:#fff;justify-content:flex-end;padding-bottom:0}
.iad-audit-report-table{width:100%;border-collapse:collapse;border-top:1px solid var(--audit-border,#dbe2eb);border-bottom:1px solid var(--audit-border,#dbe2eb);font-size:14px;line-height:1.85}
.iad-audit-report-table th,.iad-audit-report-table td{text-align:left;vertical-align:top;padding:12px 14px;border-bottom:1px solid var(--audit-border,#dbe2eb);overflow-wrap:anywhere}
.iad-audit-report-table th{font-weight:600}
.iad-audit-report-table th:first-child{width:18%;min-width:100px}
.iad-audit-report-table td:nth-child(2){white-space:nowrap}
.iad-audit-report-table tr:last-child>*{border-bottom:0}
.iad-audit-status{display:inline-block;border-radius:4px;padding:1px 9px;background:#eff2f6;color:#536174;white-space:nowrap;font-size:13px;font-weight:400}
.iad-audit-status:is([data-status=usable],[data-status=observed],[data-status=supported]){background:#e6f2eb;color:#286b49}
.iad-audit-status:is([data-status=candidate],[data-status=disputed],[data-status=pending]){background:#fff4e5;color:#835515}
.iad-audit-discovery{display:grid;gap:12px;padding:10px 0 18px;min-width:0;break-inside:avoid}
.iad-audit-discovery>header{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
.iad-audit-discovery>header>h3{margin-top:0}
#audit-page .iad-audit-document .iad-audit-scope{--iba-unified-body-size:13px;--iba-unified-ink:var(--text-secondary,#536174);font-size:13px;color:var(--text-secondary,#536174)}
.iad-audit-gallery{display:grid;gap:10px;min-width:0;padding:8px 0 4px}
.iad-audit-gallery .iad-thumbnail-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.iad-audit-gallery button.iad-thumbnail-card{max-width:none;height:174px;padding:5px}
.iad-audit-chart{display:grid;gap:10px;margin:10px 0 16px;min-width:0}
#audit-page .iad-audit-chart figcaption{--iba-unified-body-size:18px;font-size:18px;font-weight:650;margin-bottom:6px}
.iad-audit-chart-bars{display:grid;gap:16px;height:240px;border-bottom:1px solid var(--audit-border,#dbe2eb);background:repeating-linear-gradient(to top,transparent 0,transparent calc(25% - 1px),#e7edf5 calc(25% - 1px),#e7edf5 25%)}
.iad-audit-chart-column{height:100%;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.iad-audit-chart-value{margin-bottom:8px;font-variant-numeric:tabular-nums;font-weight:600}
.iad-audit-chart-bar{width:min(64px,65%);flex:none;background:#5180be;border-radius:3px 3px 0 0}
.iad-audit-chart-column:nth-child(2) .iad-audit-chart-bar{background:#89a7ca}
.iad-audit-chart-column:nth-child(3) .iad-audit-chart-bar{background:#bfcee0}
.iad-audit-chart-labels{display:grid;gap:16px;text-align:center;color:var(--text-secondary,#536174)}
.iad-audit-document ul{margin:0;padding-left:22px}
@media(max-width:900px){.iad-audit-gallery .iad-thumbnail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){#audit-page .iad-audit-document h1{font-size:25px}#audit-page .iad-audit-document h2{font-size:21px}#audit-page .iad-audit-document h3{font-size:17px}.iad-audit-document>.iad-report-section{padding:24px 0}.iad-audit-chart-bars{height:180px;gap:6px}.iad-audit-chart-labels{gap:6px;font-size:12px}.iad-audit-report-table th,.iad-audit-report-table td{padding:10px 8px}.iad-audit-report-table{min-width:520px}}
@media print{.iad-audit-gallery nav,.iad-fullscreen-dialog{display:none!important}.iad-audit-document>.iad-report-section{break-inside:auto}.iad-audit-gallery .iad-thumbnail-card{break-inside:avoid}}
`;var Tg=`
.iad-tabs[role=tablist] {flex-shrink:0;display:flex;align-items:center;gap:23px;max-width:100%;overflow-x:auto;white-space:nowrap;scrollbar-width:thin;border:0;border-bottom:1px solid var(--iad-border);margin:1px 0 16px;padding:0;}
.iad-tabs[role=tablist] > button[role=tab] {position:relative;display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;box-sizing:border-box;height:var(--iad-tab-height);min-height:var(--iad-tab-height);padding:0 1px;margin:0;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--iad-muted);font:inherit;font-size:var(--iad-font-size);font-weight:400;box-shadow:none;cursor:pointer;}
.iad-tabs[role=tablist] > button[role=tab][aria-selected=true] {color:var(--iad-primary);border-bottom-color:var(--iad-primary);font-weight:600;}
.iad-tabs[role=tablist] > button[role=tab]:hover {background:transparent;color:var(--iad-primary);}
.iad-tabs[role=tablist] > button[role=tab]:focus-visible {outline:2px solid var(--iad-primary);outline-offset:-2px;}
.iad-tabs .iad-tab-count {font-size:12px;color:inherit;font-weight:500;opacity:.85;font-variant-numeric:tabular-nums;}
.iad-tab-panel {min-width:0;}
.iad-tab-panel:focus-visible {outline:2px solid var(--iad-primary);outline-offset:2px;}
@media(max-width:640px) {.iad-tabs[role=tablist] {gap:15px;}}
`;var Og=`
.iba-scope-selector{display:flex;align-items:flex-end;flex-wrap:wrap;column-gap:var(--iad-layout-inline-gap);row-gap:12px;min-height:calc(var(--iad-layout-label-height) + var(--iad-layout-label-gap) + var(--iad-control-height));margin:0 0 var(--iad-layout-gap)}
.iba-scope-selector>.iad-scope-parent,.iba-scope-selector>.iad-scope-child{display:flex;flex-direction:column;gap:var(--iad-layout-label-gap);min-width:0;max-width:100%;flex:none}
.iba-scope-selector>.iad-scope-parent{width:var(--iad-dataset-width)}
.iba-scope-selector>.iad-scope-child{width:var(--iad-subset-width)}
.iba-scope-selector label{display:block;height:var(--iad-layout-label-height);line-height:var(--iad-layout-label-height);font-size:var(--iad-font-size);color:var(--iad-text);font-weight:400;margin:0;padding:0}
:is(.iad-workbench,.iad-detail-dialog) .iad-select{box-sizing:border-box;min-height:var(--iad-control-height);height:var(--iad-control-height);max-width:100%;font:inherit;font-size:var(--iad-font-size);color:var(--iad-text);background-color:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:0 34px 0 12px;line-height:1.4;text-overflow:ellipsis}
:is(.iad-workbench,.iad-detail-dialog) select.iad-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23536174' stroke-width='1.8'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;background-size:16px}
.iad-multiselect{width:100%;min-width:0}
:is(.iad-workbench,.iad-detail-dialog) button.iad-multiselect-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding-right:10px;text-align:left;font-weight:400}
.iad-multiselect-trigger>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.iad-multiselect-trigger>svg{flex:none;color:var(--iad-muted)}
:is(.iad-workbench,.iad-detail-dialog) .iad-select:disabled{background-color:var(--iad-surface-muted);color:var(--iad-muted);cursor:default}
.iad-select-popover{box-sizing:border-box;margin:0;padding:5px;inset:auto;max-width:calc(100vw - 24px);overflow:auto;overscroll-behavior:contain;border:1px solid var(--iad-border);border-radius:var(--iad-radius);background:var(--iad-surface);color:var(--iad-text);font:var(--iad-font-size) var(--iad-font-family);box-shadow:0 8px 24px #1723381a}
.iad-select-popover .iad-select-option{display:flex;align-items:center;gap:10px;min-height:36px;padding:6px 9px;border-radius:var(--iad-radius);cursor:pointer;font-size:var(--iad-font-size);font-weight:400;color:var(--iad-text)}
.iad-select-option:hover,.iad-select-option:focus-within{background:var(--iad-hover)}
.iad-select-option input[type=checkbox]{flex:none;width:15px;height:15px;min-height:15px;margin:0;accent-color:var(--iad-primary)}
.iad-select-option span{min-width:0;overflow-wrap:anywhere;line-height:1.5}
.iad-select-option:has(:disabled){cursor:default;color:var(--iad-muted)}
.iad-select-empty{padding:10px;margin:0}
@media(max-width:760px){.iba-scope-selector>.iad-scope-parent,.iba-scope-selector>.iad-scope-child{width:100%}}
`;var jg=`
:root{
 --iad-layout-inset:32px;
 --iad-layout-top:25px;
 --iad-layout-bottom:20px;
 --iad-layout-gap:20px;
 --iad-layout-inline-gap:16px;
 --iad-layout-title-height:42px;
 --iad-layout-label-height:19px;
 --iad-layout-label-gap:6px;
 --iad-layout-section-height:70px;
 --iad-layout-section-inset:20px;
 --iad-job-head-height:46px;
 --iad-job-row-height:60px;
 --iad-job-scroll-height:346px;
 --iad-job-search-width:200px;
 --iad-job-status-width:155px;
}
.iad-job-table-scroll{min-width:0;min-height:0;max-height:var(--iad-job-scroll-height);overflow:auto;scrollbar-gutter:stable}
.iad-job-table-grid thead tr,.iad-job-table-grid thead th{height:var(--iad-job-head-height)}
.iad-job-table-grid tbody tr,.iad-job-table-grid tbody td{height:var(--iad-job-row-height)}
.iad-job-table-grid thead th{padding:10px 18px;vertical-align:middle;position:sticky;top:0;z-index:2;background:var(--iad-surface-muted)}
.iad-job-table-grid tbody td{padding:8px 18px;vertical-align:middle}
.iad-section-heading .iad-section-actions input{width:var(--iad-job-search-width);height:var(--iad-control-height)}
.iad-section-heading .iad-section-actions select{width:var(--iad-job-status-width);height:var(--iad-control-height)}
@media(max-width:780px){:root{--iad-layout-inset:20px}}
@media(max-width:580px){:root{--iad-layout-inset:16px;--iad-layout-section-inset:16px}}
`;var Ag=ug+jg+fg+gg+mg+hg+xg+vg+yg+bg+wg+kg+Sg+Ig+Eg+_g+Cg+Ng+cg+Og+Tg+zg+Lg+Pg+Rg;var pr=I(L(),1),Gx=document.getElementById("audit-report-data"),{report:qx,images:Wx}=JSON.parse(Gx.textContent),Dg=document.createElement("style");Dg.textContent=Ag+`
body{margin:0;background:#fff}.iad-offline-report{width:100%;margin:24px auto;padding:0 20px}`;document.head.append(Dg);(0,Mg.createRoot)(document.getElementById("audit-offline-root")).render((0,pr.jsx)("main",{className:"iad-workbench iad-offline-report",id:"audit-page",children:(0,pr.jsx)("section",{className:"iad-dataset-report",id:"audit-report",children:(0,pr.jsx)("div",{className:"iad-report-body",children:(0,pr.jsx)(pg,{report:qx,imageUrl:e=>Wx[e.image.evidence_id]})})})}));})();
