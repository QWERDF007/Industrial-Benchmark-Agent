"use strict";(()=>{var pm=Object.create;var dd=Object.defineProperty;var cm=Object.getOwnPropertyDescriptor;var um=Object.getOwnPropertyNames;var fm=Object.getPrototypeOf,gm=Object.prototype.hasOwnProperty;var ct=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(i){throw t=0,i}};var mm=(e,t,i,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of um(t))!gm.call(e,r)&&r!==i&&dd(e,r,{get:()=>t[r],enumerable:!(n=cm(t,r))||n.enumerable});return e};var I=(e,t,i)=>(i=e!=null?pm(fm(e)):{},mm(t||!e||!e.__esModule?dd(i,"default",{value:e,enumerable:!0}):i,e));var wd=ct(A=>{"use strict";var fn=Symbol.for("react.element"),hm=Symbol.for("react.portal"),xm=Symbol.for("react.fragment"),vm=Symbol.for("react.strict_mode"),ym=Symbol.for("react.profiler"),bm=Symbol.for("react.provider"),wm=Symbol.for("react.context"),km=Symbol.for("react.forward_ref"),Sm=Symbol.for("react.suspense"),Im=Symbol.for("react.memo"),Em=Symbol.for("react.lazy"),pd=Symbol.iterator;function _m(e){return e===null||typeof e!="object"?null:(e=pd&&e[pd]||e["@@iterator"],typeof e=="function"?e:null)}var fd={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},gd=Object.assign,md={};function Si(e,t,i){this.props=e,this.context=t,this.refs=md,this.updater=i||fd}Si.prototype.isReactComponent={};Si.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};Si.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function hd(){}hd.prototype=Si.prototype;function ho(e,t,i){this.props=e,this.context=t,this.refs=md,this.updater=i||fd}var xo=ho.prototype=new hd;xo.constructor=ho;gd(xo,Si.prototype);xo.isPureReactComponent=!0;var cd=Array.isArray,xd=Object.prototype.hasOwnProperty,vo={current:null},vd={key:!0,ref:!0,__self:!0,__source:!0};function yd(e,t,i){var n,r={},a=null,o=null;if(t!=null)for(n in t.ref!==void 0&&(o=t.ref),t.key!==void 0&&(a=""+t.key),t)xd.call(t,n)&&!vd.hasOwnProperty(n)&&(r[n]=t[n]);var l=arguments.length-2;if(l===1)r.children=i;else if(1<l){for(var s=Array(l),d=0;d<l;d++)s[d]=arguments[d+2];r.children=s}if(e&&e.defaultProps)for(n in l=e.defaultProps,l)r[n]===void 0&&(r[n]=l[n]);return{$$typeof:fn,type:e,key:a,ref:o,props:r,_owner:vo.current}}function Cm(e,t){return{$$typeof:fn,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function yo(e){return typeof e=="object"&&e!==null&&e.$$typeof===fn}function Rm(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(i){return t[i]})}var ud=/\/+/g;function mo(e,t){return typeof e=="object"&&e!==null&&e.key!=null?Rm(""+e.key):t.toString(36)}function Sr(e,t,i,n,r){var a=typeof e;(a==="undefined"||a==="boolean")&&(e=null);var o=!1;if(e===null)o=!0;else switch(a){case"string":case"number":o=!0;break;case"object":switch(e.$$typeof){case fn:case hm:o=!0}}if(o)return o=e,r=r(o),e=n===""?"."+mo(o,0):n,cd(r)?(i="",e!=null&&(i=e.replace(ud,"$&/")+"/"),Sr(r,t,i,"",function(d){return d})):r!=null&&(yo(r)&&(r=Cm(r,i+(!r.key||o&&o.key===r.key?"":(""+r.key).replace(ud,"$&/")+"/")+e)),t.push(r)),1;if(o=0,n=n===""?".":n+":",cd(e))for(var l=0;l<e.length;l++){a=e[l];var s=n+mo(a,l);o+=Sr(a,t,i,s,r)}else if(s=_m(e),typeof s=="function")for(e=s.call(e),l=0;!(a=e.next()).done;)a=a.value,s=n+mo(a,l++),o+=Sr(a,t,i,s,r);else if(a==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return o}function kr(e,t,i){if(e==null)return e;var n=[],r=0;return Sr(e,n,"","",function(a){return t.call(i,a,r++)}),n}function Nm(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(i){(e._status===0||e._status===-1)&&(e._status=1,e._result=i)},function(i){(e._status===0||e._status===-1)&&(e._status=2,e._result=i)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var he={current:null},Ir={transition:null},zm={ReactCurrentDispatcher:he,ReactCurrentBatchConfig:Ir,ReactCurrentOwner:vo};function bd(){throw Error("act(...) is not supported in production builds of React.")}A.Children={map:kr,forEach:function(e,t,i){kr(e,function(){t.apply(this,arguments)},i)},count:function(e){var t=0;return kr(e,function(){t++}),t},toArray:function(e){return kr(e,function(t){return t})||[]},only:function(e){if(!yo(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};A.Component=Si;A.Fragment=xm;A.Profiler=ym;A.PureComponent=ho;A.StrictMode=vm;A.Suspense=Sm;A.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=zm;A.act=bd;A.cloneElement=function(e,t,i){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var n=gd({},e.props),r=e.key,a=e.ref,o=e._owner;if(t!=null){if(t.ref!==void 0&&(a=t.ref,o=vo.current),t.key!==void 0&&(r=""+t.key),e.type&&e.type.defaultProps)var l=e.type.defaultProps;for(s in t)xd.call(t,s)&&!vd.hasOwnProperty(s)&&(n[s]=t[s]===void 0&&l!==void 0?l[s]:t[s])}var s=arguments.length-2;if(s===1)n.children=i;else if(1<s){l=Array(s);for(var d=0;d<s;d++)l[d]=arguments[d+2];n.children=l}return{$$typeof:fn,type:e.type,key:r,ref:a,props:n,_owner:o}};A.createContext=function(e){return e={$$typeof:wm,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:bm,_context:e},e.Consumer=e};A.createElement=yd;A.createFactory=function(e){var t=yd.bind(null,e);return t.type=e,t};A.createRef=function(){return{current:null}};A.forwardRef=function(e){return{$$typeof:km,render:e}};A.isValidElement=yo;A.lazy=function(e){return{$$typeof:Em,_payload:{_status:-1,_result:e},_init:Nm}};A.memo=function(e,t){return{$$typeof:Im,type:e,compare:t===void 0?null:t}};A.startTransition=function(e){var t=Ir.transition;Ir.transition={};try{e()}finally{Ir.transition=t}};A.unstable_act=bd;A.useCallback=function(e,t){return he.current.useCallback(e,t)};A.useContext=function(e){return he.current.useContext(e)};A.useDebugValue=function(){};A.useDeferredValue=function(e){return he.current.useDeferredValue(e)};A.useEffect=function(e,t){return he.current.useEffect(e,t)};A.useId=function(){return he.current.useId()};A.useImperativeHandle=function(e,t,i){return he.current.useImperativeHandle(e,t,i)};A.useInsertionEffect=function(e,t){return he.current.useInsertionEffect(e,t)};A.useLayoutEffect=function(e,t){return he.current.useLayoutEffect(e,t)};A.useMemo=function(e,t){return he.current.useMemo(e,t)};A.useReducer=function(e,t,i){return he.current.useReducer(e,t,i)};A.useRef=function(e){return he.current.useRef(e)};A.useState=function(e){return he.current.useState(e)};A.useSyncExternalStore=function(e,t,i){return he.current.useSyncExternalStore(e,t,i)};A.useTransition=function(){return he.current.useTransition()};A.version="18.3.1"});var U=ct((gv,kd)=>{"use strict";kd.exports=wd()});var Ld=ct(H=>{"use strict";function So(e,t){var i=e.length;e.push(t);e:for(;0<i;){var n=i-1>>>1,r=e[n];if(0<Er(r,t))e[n]=t,e[i]=r,i=n;else break e}}function Be(e){return e.length===0?null:e[0]}function Cr(e){if(e.length===0)return null;var t=e[0],i=e.pop();if(i!==t){e[0]=i;e:for(var n=0,r=e.length,a=r>>>1;n<a;){var o=2*(n+1)-1,l=e[o],s=o+1,d=e[s];if(0>Er(l,i))s<r&&0>Er(d,l)?(e[n]=d,e[s]=i,n=s):(e[n]=l,e[o]=i,n=o);else if(s<r&&0>Er(d,i))e[n]=d,e[s]=i,n=s;else break e}}return t}function Er(e,t){var i=e.sortIndex-t.sortIndex;return i!==0?i:e.id-t.id}typeof performance=="object"&&typeof performance.now=="function"?(Sd=performance,H.unstable_now=function(){return Sd.now()}):(bo=Date,Id=bo.now(),H.unstable_now=function(){return bo.now()-Id});var Sd,bo,Id,Xe=[],Et=[],Pm=1,Te=null,ce=3,Rr=!1,ii=!1,mn=!1,Cd=typeof setTimeout=="function"?setTimeout:null,Rd=typeof clearTimeout=="function"?clearTimeout:null,Ed=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function Io(e){for(var t=Be(Et);t!==null;){if(t.callback===null)Cr(Et);else if(t.startTime<=e)Cr(Et),t.sortIndex=t.expirationTime,So(Xe,t);else break;t=Be(Et)}}function Eo(e){if(mn=!1,Io(e),!ii)if(Be(Xe)!==null)ii=!0,Co(_o);else{var t=Be(Et);t!==null&&Ro(Eo,t.startTime-e)}}function _o(e,t){ii=!1,mn&&(mn=!1,Rd(hn),hn=-1),Rr=!0;var i=ce;try{for(Io(t),Te=Be(Xe);Te!==null&&(!(Te.expirationTime>t)||e&&!Pd());){var n=Te.callback;if(typeof n=="function"){Te.callback=null,ce=Te.priorityLevel;var r=n(Te.expirationTime<=t);t=H.unstable_now(),typeof r=="function"?Te.callback=r:Te===Be(Xe)&&Cr(Xe),Io(t)}else Cr(Xe);Te=Be(Xe)}if(Te!==null)var a=!0;else{var o=Be(Et);o!==null&&Ro(Eo,o.startTime-t),a=!1}return a}finally{Te=null,ce=i,Rr=!1}}var Nr=!1,_r=null,hn=-1,Nd=5,zd=-1;function Pd(){return!(H.unstable_now()-zd<Nd)}function wo(){if(_r!==null){var e=H.unstable_now();zd=e;var t=!0;try{t=_r(!0,e)}finally{t?gn():(Nr=!1,_r=null)}}else Nr=!1}var gn;typeof Ed=="function"?gn=function(){Ed(wo)}:typeof MessageChannel<"u"?(ko=new MessageChannel,_d=ko.port2,ko.port1.onmessage=wo,gn=function(){_d.postMessage(null)}):gn=function(){Cd(wo,0)};var ko,_d;function Co(e){_r=e,Nr||(Nr=!0,gn())}function Ro(e,t){hn=Cd(function(){e(H.unstable_now())},t)}H.unstable_IdlePriority=5;H.unstable_ImmediatePriority=1;H.unstable_LowPriority=4;H.unstable_NormalPriority=3;H.unstable_Profiling=null;H.unstable_UserBlockingPriority=2;H.unstable_cancelCallback=function(e){e.callback=null};H.unstable_continueExecution=function(){ii||Rr||(ii=!0,Co(_o))};H.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):Nd=0<e?Math.floor(1e3/e):5};H.unstable_getCurrentPriorityLevel=function(){return ce};H.unstable_getFirstCallbackNode=function(){return Be(Xe)};H.unstable_next=function(e){switch(ce){case 1:case 2:case 3:var t=3;break;default:t=ce}var i=ce;ce=t;try{return e()}finally{ce=i}};H.unstable_pauseExecution=function(){};H.unstable_requestPaint=function(){};H.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var i=ce;ce=e;try{return t()}finally{ce=i}};H.unstable_scheduleCallback=function(e,t,i){var n=H.unstable_now();switch(typeof i=="object"&&i!==null?(i=i.delay,i=typeof i=="number"&&0<i?n+i:n):i=n,e){case 1:var r=-1;break;case 2:r=250;break;case 5:r=1073741823;break;case 4:r=1e4;break;default:r=5e3}return r=i+r,e={id:Pm++,callback:t,priorityLevel:e,startTime:i,expirationTime:r,sortIndex:-1},i>n?(e.sortIndex=i,So(Et,e),Be(Xe)===null&&e===Be(Et)&&(mn?(Rd(hn),hn=-1):mn=!0,Ro(Eo,i-n))):(e.sortIndex=r,So(Xe,e),ii||Rr||(ii=!0,Co(_o))),e};H.unstable_shouldYield=Pd;H.unstable_wrapCallback=function(e){var t=ce;return function(){var i=ce;ce=t;try{return e.apply(this,arguments)}finally{ce=i}}}});var Ad=ct((hv,Td)=>{"use strict";Td.exports=Ld()});var Du=ct(ze=>{"use strict";var Lm=U(),Re=Ad();function w(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,i=1;i<arguments.length;i++)t+="&args[]="+encodeURIComponent(arguments[i]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Bp=new Set,Dn={};function mi(e,t){Qi(e,t),Qi(e+"Capture",t)}function Qi(e,t){for(Dn[e]=t,e=0;e<t.length;e++)Bp.add(t[e])}var xt=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Xo=Object.prototype.hasOwnProperty,Tm=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,Od={},jd={};function Am(e){return Xo.call(jd,e)?!0:Xo.call(Od,e)?!1:Tm.test(e)?jd[e]=!0:(Od[e]=!0,!1)}function Om(e,t,i,n){if(i!==null&&i.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return n?!1:i!==null?!i.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function jm(e,t,i,n){if(t===null||typeof t>"u"||Om(e,t,i,n))return!0;if(n)return!1;if(i!==null)switch(i.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function ye(e,t,i,n,r,a,o){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=n,this.attributeNamespace=r,this.mustUseProperty=i,this.propertyName=e,this.type=t,this.sanitizeURL=a,this.removeEmptyString=o}var pe={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){pe[e]=new ye(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];pe[t]=new ye(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){pe[e]=new ye(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){pe[e]=new ye(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){pe[e]=new ye(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){pe[e]=new ye(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){pe[e]=new ye(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){pe[e]=new ye(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){pe[e]=new ye(e,5,!1,e.toLowerCase(),null,!1,!1)});var Vl=/[\-:]([a-z])/g;function Ql(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(Vl,Ql);pe[t]=new ye(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(Vl,Ql);pe[t]=new ye(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(Vl,Ql);pe[t]=new ye(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){pe[e]=new ye(e,1,!1,e.toLowerCase(),null,!1,!1)});pe.xlinkHref=new ye("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){pe[e]=new ye(e,1,!1,e.toLowerCase(),null,!0,!0)});function Gl(e,t,i,n){var r=pe.hasOwnProperty(t)?pe[t]:null;(r!==null?r.type!==0:n||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(jm(t,i,r,n)&&(i=null),n||r===null?Am(t)&&(i===null?e.removeAttribute(t):e.setAttribute(t,""+i)):r.mustUseProperty?e[r.propertyName]=i===null?r.type===3?!1:"":i:(t=r.attributeName,n=r.attributeNamespace,i===null?e.removeAttribute(t):(r=r.type,i=r===3||r===4&&i===!0?"":""+i,n?e.setAttributeNS(n,t,i):e.setAttribute(t,i))))}var wt=Lm.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,zr=Symbol.for("react.element"),_i=Symbol.for("react.portal"),Ci=Symbol.for("react.fragment"),Wl=Symbol.for("react.strict_mode"),Zo=Symbol.for("react.profiler"),Hp=Symbol.for("react.provider"),Vp=Symbol.for("react.context"),ql=Symbol.for("react.forward_ref"),Jo=Symbol.for("react.suspense"),el=Symbol.for("react.suspense_list"),Kl=Symbol.for("react.memo"),Ct=Symbol.for("react.lazy"),Qp=Symbol.for("react.offscreen"),Md=Symbol.iterator;function xn(e){return e===null||typeof e!="object"?null:(e=Md&&e[Md]||e["@@iterator"],typeof e=="function"?e:null)}var X=Object.assign,No;function En(e){if(No===void 0)try{throw Error()}catch(i){var t=i.stack.trim().match(/\n( *(at )?)/);No=t&&t[1]||""}return`
`+No+e}var zo=!1;function Po(e,t){if(!e||zo)return"";zo=!0;var i=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(d){var n=d}Reflect.construct(e,[],t)}else{try{t.call()}catch(d){n=d}e.call(t.prototype)}else{try{throw Error()}catch(d){n=d}e()}}catch(d){if(d&&n&&typeof d.stack=="string"){for(var r=d.stack.split(`
`),a=n.stack.split(`
`),o=r.length-1,l=a.length-1;1<=o&&0<=l&&r[o]!==a[l];)l--;for(;1<=o&&0<=l;o--,l--)if(r[o]!==a[l]){if(o!==1||l!==1)do if(o--,l--,0>l||r[o]!==a[l]){var s=`
`+r[o].replace(" at new "," at ");return e.displayName&&s.includes("<anonymous>")&&(s=s.replace("<anonymous>",e.displayName)),s}while(1<=o&&0<=l);break}}}finally{zo=!1,Error.prepareStackTrace=i}return(e=e?e.displayName||e.name:"")?En(e):""}function Mm(e){switch(e.tag){case 5:return En(e.type);case 16:return En("Lazy");case 13:return En("Suspense");case 19:return En("SuspenseList");case 0:case 2:case 15:return e=Po(e.type,!1),e;case 11:return e=Po(e.type.render,!1),e;case 1:return e=Po(e.type,!0),e;default:return""}}function tl(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Ci:return"Fragment";case _i:return"Portal";case Zo:return"Profiler";case Wl:return"StrictMode";case Jo:return"Suspense";case el:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Vp:return(e.displayName||"Context")+".Consumer";case Hp:return(e._context.displayName||"Context")+".Provider";case ql:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Kl:return t=e.displayName||null,t!==null?t:tl(e.type)||"Memo";case Ct:t=e._payload,e=e._init;try{return tl(e(t))}catch{}}return null}function Dm(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return tl(t);case 8:return t===Wl?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function Bt(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Gp(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Fm(e){var t=Gp(e)?"checked":"value",i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),n=""+e[t];if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var r=i.get,a=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return r.call(this)},set:function(o){n=""+o,a.call(this,o)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return n},setValue:function(o){n=""+o},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Pr(e){e._valueTracker||(e._valueTracker=Fm(e))}function Wp(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var i=t.getValue(),n="";return e&&(n=Gp(e)?e.checked?"true":"false":e.value),e=n,e!==i?(t.setValue(e),!0):!1}function aa(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function il(e,t){var i=t.checked;return X({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:i??e._wrapperState.initialChecked})}function Dd(e,t){var i=t.defaultValue==null?"":t.defaultValue,n=t.checked!=null?t.checked:t.defaultChecked;i=Bt(t.value!=null?t.value:i),e._wrapperState={initialChecked:n,initialValue:i,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function qp(e,t){t=t.checked,t!=null&&Gl(e,"checked",t,!1)}function nl(e,t){qp(e,t);var i=Bt(t.value),n=t.type;if(i!=null)n==="number"?(i===0&&e.value===""||e.value!=i)&&(e.value=""+i):e.value!==""+i&&(e.value=""+i);else if(n==="submit"||n==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?rl(e,t.type,i):t.hasOwnProperty("defaultValue")&&rl(e,t.type,Bt(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function Fd(e,t,i){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var n=t.type;if(!(n!=="submit"&&n!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,i||t===e.value||(e.value=t),e.defaultValue=t}i=e.name,i!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,i!==""&&(e.name=i)}function rl(e,t,i){(t!=="number"||aa(e.ownerDocument)!==e)&&(i==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+i&&(e.defaultValue=""+i))}var _n=Array.isArray;function Di(e,t,i,n){if(e=e.options,t){t={};for(var r=0;r<i.length;r++)t["$"+i[r]]=!0;for(i=0;i<e.length;i++)r=t.hasOwnProperty("$"+e[i].value),e[i].selected!==r&&(e[i].selected=r),r&&n&&(e[i].defaultSelected=!0)}else{for(i=""+Bt(i),t=null,r=0;r<e.length;r++){if(e[r].value===i){e[r].selected=!0,n&&(e[r].defaultSelected=!0);return}t!==null||e[r].disabled||(t=e[r])}t!==null&&(t.selected=!0)}}function al(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(w(91));return X({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function Ud(e,t){var i=t.value;if(i==null){if(i=t.children,t=t.defaultValue,i!=null){if(t!=null)throw Error(w(92));if(_n(i)){if(1<i.length)throw Error(w(93));i=i[0]}t=i}t==null&&(t=""),i=t}e._wrapperState={initialValue:Bt(i)}}function Kp(e,t){var i=Bt(t.value),n=Bt(t.defaultValue);i!=null&&(i=""+i,i!==e.value&&(e.value=i),t.defaultValue==null&&e.defaultValue!==i&&(e.defaultValue=i)),n!=null&&(e.defaultValue=""+n)}function Bd(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function $p(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function ol(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?$p(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var Lr,Yp=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,i,n,r){MSApp.execUnsafeLocalFunction(function(){return e(t,i,n,r)})}:e})(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(Lr=Lr||document.createElement("div"),Lr.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=Lr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Fn(e,t){if(t){var i=e.firstChild;if(i&&i===e.lastChild&&i.nodeType===3){i.nodeValue=t;return}}e.textContent=t}var Nn={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Um=["Webkit","ms","Moz","O"];Object.keys(Nn).forEach(function(e){Um.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Nn[t]=Nn[e]})});function Xp(e,t,i){return t==null||typeof t=="boolean"||t===""?"":i||typeof t!="number"||t===0||Nn.hasOwnProperty(e)&&Nn[e]?(""+t).trim():t+"px"}function Zp(e,t){e=e.style;for(var i in t)if(t.hasOwnProperty(i)){var n=i.indexOf("--")===0,r=Xp(i,t[i],n);i==="float"&&(i="cssFloat"),n?e.setProperty(i,r):e[i]=r}}var Bm=X({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function ll(e,t){if(t){if(Bm[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(w(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(w(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(w(61))}if(t.style!=null&&typeof t.style!="object")throw Error(w(62))}}function sl(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var dl=null;function $l(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var pl=null,Fi=null,Ui=null;function Hd(e){if(e=nr(e)){if(typeof pl!="function")throw Error(w(280));var t=e.stateNode;t&&(t=Ta(t),pl(e.stateNode,e.type,t))}}function Jp(e){Fi?Ui?Ui.push(e):Ui=[e]:Fi=e}function ec(){if(Fi){var e=Fi,t=Ui;if(Ui=Fi=null,Hd(e),t)for(e=0;e<t.length;e++)Hd(t[e])}}function tc(e,t){return e(t)}function ic(){}var Lo=!1;function nc(e,t,i){if(Lo)return e(t,i);Lo=!0;try{return tc(e,t,i)}finally{Lo=!1,(Fi!==null||Ui!==null)&&(ic(),ec())}}function Un(e,t){var i=e.stateNode;if(i===null)return null;var n=Ta(i);if(n===null)return null;i=n[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(n=!n.disabled)||(e=e.type,n=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!n;break e;default:e=!1}if(e)return null;if(i&&typeof i!="function")throw Error(w(231,t,typeof i));return i}var cl=!1;if(xt)try{Ii={},Object.defineProperty(Ii,"passive",{get:function(){cl=!0}}),window.addEventListener("test",Ii,Ii),window.removeEventListener("test",Ii,Ii)}catch{cl=!1}var Ii;function Hm(e,t,i,n,r,a,o,l,s){var d=Array.prototype.slice.call(arguments,3);try{t.apply(i,d)}catch(u){this.onError(u)}}var zn=!1,oa=null,la=!1,ul=null,Vm={onError:function(e){zn=!0,oa=e}};function Qm(e,t,i,n,r,a,o,l,s){zn=!1,oa=null,Hm.apply(Vm,arguments)}function Gm(e,t,i,n,r,a,o,l,s){if(Qm.apply(this,arguments),zn){if(zn){var d=oa;zn=!1,oa=null}else throw Error(w(198));la||(la=!0,ul=d)}}function hi(e){var t=e,i=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(i=t.return),e=t.return;while(e)}return t.tag===3?i:null}function rc(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Vd(e){if(hi(e)!==e)throw Error(w(188))}function Wm(e){var t=e.alternate;if(!t){if(t=hi(e),t===null)throw Error(w(188));return t!==e?null:e}for(var i=e,n=t;;){var r=i.return;if(r===null)break;var a=r.alternate;if(a===null){if(n=r.return,n!==null){i=n;continue}break}if(r.child===a.child){for(a=r.child;a;){if(a===i)return Vd(r),e;if(a===n)return Vd(r),t;a=a.sibling}throw Error(w(188))}if(i.return!==n.return)i=r,n=a;else{for(var o=!1,l=r.child;l;){if(l===i){o=!0,i=r,n=a;break}if(l===n){o=!0,n=r,i=a;break}l=l.sibling}if(!o){for(l=a.child;l;){if(l===i){o=!0,i=a,n=r;break}if(l===n){o=!0,n=a,i=r;break}l=l.sibling}if(!o)throw Error(w(189))}}if(i.alternate!==n)throw Error(w(190))}if(i.tag!==3)throw Error(w(188));return i.stateNode.current===i?e:t}function ac(e){return e=Wm(e),e!==null?oc(e):null}function oc(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=oc(e);if(t!==null)return t;e=e.sibling}return null}var lc=Re.unstable_scheduleCallback,Qd=Re.unstable_cancelCallback,qm=Re.unstable_shouldYield,Km=Re.unstable_requestPaint,ee=Re.unstable_now,$m=Re.unstable_getCurrentPriorityLevel,Yl=Re.unstable_ImmediatePriority,sc=Re.unstable_UserBlockingPriority,sa=Re.unstable_NormalPriority,Ym=Re.unstable_LowPriority,dc=Re.unstable_IdlePriority,Na=null,tt=null;function Xm(e){if(tt&&typeof tt.onCommitFiberRoot=="function")try{tt.onCommitFiberRoot(Na,e,void 0,(e.current.flags&128)===128)}catch{}}var We=Math.clz32?Math.clz32:eh,Zm=Math.log,Jm=Math.LN2;function eh(e){return e>>>=0,e===0?32:31-(Zm(e)/Jm|0)|0}var Tr=64,Ar=4194304;function Cn(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function da(e,t){var i=e.pendingLanes;if(i===0)return 0;var n=0,r=e.suspendedLanes,a=e.pingedLanes,o=i&268435455;if(o!==0){var l=o&~r;l!==0?n=Cn(l):(a&=o,a!==0&&(n=Cn(a)))}else o=i&~r,o!==0?n=Cn(o):a!==0&&(n=Cn(a));if(n===0)return 0;if(t!==0&&t!==n&&(t&r)===0&&(r=n&-n,a=t&-t,r>=a||r===16&&(a&4194240)!==0))return t;if((n&4)!==0&&(n|=i&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=n;0<t;)i=31-We(t),r=1<<i,n|=e[i],t&=~r;return n}function th(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function ih(e,t){for(var i=e.suspendedLanes,n=e.pingedLanes,r=e.expirationTimes,a=e.pendingLanes;0<a;){var o=31-We(a),l=1<<o,s=r[o];s===-1?((l&i)===0||(l&n)!==0)&&(r[o]=th(l,t)):s<=t&&(e.expiredLanes|=l),a&=~l}}function fl(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function pc(){var e=Tr;return Tr<<=1,(Tr&4194240)===0&&(Tr=64),e}function To(e){for(var t=[],i=0;31>i;i++)t.push(e);return t}function tr(e,t,i){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-We(t),e[t]=i}function nh(e,t){var i=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var n=e.eventTimes;for(e=e.expirationTimes;0<i;){var r=31-We(i),a=1<<r;t[r]=0,n[r]=-1,e[r]=-1,i&=~a}}function Xl(e,t){var i=e.entangledLanes|=t;for(e=e.entanglements;i;){var n=31-We(i),r=1<<n;r&t|e[n]&t&&(e[n]|=t),i&=~r}}var F=0;function cc(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var uc,Zl,fc,gc,mc,gl=!1,Or=[],Tt=null,At=null,Ot=null,Bn=new Map,Hn=new Map,Nt=[],rh="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Gd(e,t){switch(e){case"focusin":case"focusout":Tt=null;break;case"dragenter":case"dragleave":At=null;break;case"mouseover":case"mouseout":Ot=null;break;case"pointerover":case"pointerout":Bn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Hn.delete(t.pointerId)}}function vn(e,t,i,n,r,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:i,eventSystemFlags:n,nativeEvent:a,targetContainers:[r]},t!==null&&(t=nr(t),t!==null&&Zl(t)),e):(e.eventSystemFlags|=n,t=e.targetContainers,r!==null&&t.indexOf(r)===-1&&t.push(r),e)}function ah(e,t,i,n,r){switch(t){case"focusin":return Tt=vn(Tt,e,t,i,n,r),!0;case"dragenter":return At=vn(At,e,t,i,n,r),!0;case"mouseover":return Ot=vn(Ot,e,t,i,n,r),!0;case"pointerover":var a=r.pointerId;return Bn.set(a,vn(Bn.get(a)||null,e,t,i,n,r)),!0;case"gotpointercapture":return a=r.pointerId,Hn.set(a,vn(Hn.get(a)||null,e,t,i,n,r)),!0}return!1}function hc(e){var t=ai(e.target);if(t!==null){var i=hi(t);if(i!==null){if(t=i.tag,t===13){if(t=rc(i),t!==null){e.blockedOn=t,mc(e.priority,function(){fc(i)});return}}else if(t===3&&i.stateNode.current.memoizedState.isDehydrated){e.blockedOn=i.tag===3?i.stateNode.containerInfo:null;return}}}e.blockedOn=null}function $r(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var i=ml(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(i===null){i=e.nativeEvent;var n=new i.constructor(i.type,i);dl=n,i.target.dispatchEvent(n),dl=null}else return t=nr(i),t!==null&&Zl(t),e.blockedOn=i,!1;t.shift()}return!0}function Wd(e,t,i){$r(e)&&i.delete(t)}function oh(){gl=!1,Tt!==null&&$r(Tt)&&(Tt=null),At!==null&&$r(At)&&(At=null),Ot!==null&&$r(Ot)&&(Ot=null),Bn.forEach(Wd),Hn.forEach(Wd)}function yn(e,t){e.blockedOn===t&&(e.blockedOn=null,gl||(gl=!0,Re.unstable_scheduleCallback(Re.unstable_NormalPriority,oh)))}function Vn(e){function t(r){return yn(r,e)}if(0<Or.length){yn(Or[0],e);for(var i=1;i<Or.length;i++){var n=Or[i];n.blockedOn===e&&(n.blockedOn=null)}}for(Tt!==null&&yn(Tt,e),At!==null&&yn(At,e),Ot!==null&&yn(Ot,e),Bn.forEach(t),Hn.forEach(t),i=0;i<Nt.length;i++)n=Nt[i],n.blockedOn===e&&(n.blockedOn=null);for(;0<Nt.length&&(i=Nt[0],i.blockedOn===null);)hc(i),i.blockedOn===null&&Nt.shift()}var Bi=wt.ReactCurrentBatchConfig,pa=!0;function lh(e,t,i,n){var r=F,a=Bi.transition;Bi.transition=null;try{F=1,Jl(e,t,i,n)}finally{F=r,Bi.transition=a}}function sh(e,t,i,n){var r=F,a=Bi.transition;Bi.transition=null;try{F=4,Jl(e,t,i,n)}finally{F=r,Bi.transition=a}}function Jl(e,t,i,n){if(pa){var r=ml(e,t,i,n);if(r===null)Uo(e,t,n,ca,i),Gd(e,n);else if(ah(r,e,t,i,n))n.stopPropagation();else if(Gd(e,n),t&4&&-1<rh.indexOf(e)){for(;r!==null;){var a=nr(r);if(a!==null&&uc(a),a=ml(e,t,i,n),a===null&&Uo(e,t,n,ca,i),a===r)break;r=a}r!==null&&n.stopPropagation()}else Uo(e,t,n,null,i)}}var ca=null;function ml(e,t,i,n){if(ca=null,e=$l(n),e=ai(e),e!==null)if(t=hi(e),t===null)e=null;else if(i=t.tag,i===13){if(e=rc(t),e!==null)return e;e=null}else if(i===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return ca=e,null}function xc(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch($m()){case Yl:return 1;case sc:return 4;case sa:case Ym:return 16;case dc:return 536870912;default:return 16}default:return 16}}var Pt=null,es=null,Yr=null;function vc(){if(Yr)return Yr;var e,t=es,i=t.length,n,r="value"in Pt?Pt.value:Pt.textContent,a=r.length;for(e=0;e<i&&t[e]===r[e];e++);var o=i-e;for(n=1;n<=o&&t[i-n]===r[a-n];n++);return Yr=r.slice(e,1<n?1-n:void 0)}function Xr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function jr(){return!0}function qd(){return!1}function Ne(e){function t(i,n,r,a,o){this._reactName=i,this._targetInst=r,this.type=n,this.nativeEvent=a,this.target=o,this.currentTarget=null;for(var l in e)e.hasOwnProperty(l)&&(i=e[l],this[l]=i?i(a):a[l]);return this.isDefaultPrevented=(a.defaultPrevented!=null?a.defaultPrevented:a.returnValue===!1)?jr:qd,this.isPropagationStopped=qd,this}return X(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var i=this.nativeEvent;i&&(i.preventDefault?i.preventDefault():typeof i.returnValue!="unknown"&&(i.returnValue=!1),this.isDefaultPrevented=jr)},stopPropagation:function(){var i=this.nativeEvent;i&&(i.stopPropagation?i.stopPropagation():typeof i.cancelBubble!="unknown"&&(i.cancelBubble=!0),this.isPropagationStopped=jr)},persist:function(){},isPersistent:jr}),t}var Xi={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},ts=Ne(Xi),ir=X({},Xi,{view:0,detail:0}),dh=Ne(ir),Ao,Oo,bn,za=X({},ir,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:is,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==bn&&(bn&&e.type==="mousemove"?(Ao=e.screenX-bn.screenX,Oo=e.screenY-bn.screenY):Oo=Ao=0,bn=e),Ao)},movementY:function(e){return"movementY"in e?e.movementY:Oo}}),Kd=Ne(za),ph=X({},za,{dataTransfer:0}),ch=Ne(ph),uh=X({},ir,{relatedTarget:0}),jo=Ne(uh),fh=X({},Xi,{animationName:0,elapsedTime:0,pseudoElement:0}),gh=Ne(fh),mh=X({},Xi,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),hh=Ne(mh),xh=X({},Xi,{data:0}),$d=Ne(xh),vh={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},yh={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},bh={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function wh(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=bh[e])?!!t[e]:!1}function is(){return wh}var kh=X({},ir,{key:function(e){if(e.key){var t=vh[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Xr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?yh[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:is,charCode:function(e){return e.type==="keypress"?Xr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Xr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Sh=Ne(kh),Ih=X({},za,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Yd=Ne(Ih),Eh=X({},ir,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:is}),_h=Ne(Eh),Ch=X({},Xi,{propertyName:0,elapsedTime:0,pseudoElement:0}),Rh=Ne(Ch),Nh=X({},za,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),zh=Ne(Nh),Ph=[9,13,27,32],ns=xt&&"CompositionEvent"in window,Pn=null;xt&&"documentMode"in document&&(Pn=document.documentMode);var Lh=xt&&"TextEvent"in window&&!Pn,yc=xt&&(!ns||Pn&&8<Pn&&11>=Pn),Xd=" ",Zd=!1;function bc(e,t){switch(e){case"keyup":return Ph.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function wc(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Ri=!1;function Th(e,t){switch(e){case"compositionend":return wc(t);case"keypress":return t.which!==32?null:(Zd=!0,Xd);case"textInput":return e=t.data,e===Xd&&Zd?null:e;default:return null}}function Ah(e,t){if(Ri)return e==="compositionend"||!ns&&bc(e,t)?(e=vc(),Yr=es=Pt=null,Ri=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return yc&&t.locale!=="ko"?null:t.data;default:return null}}var Oh={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Jd(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!Oh[e.type]:t==="textarea"}function kc(e,t,i,n){Jp(n),t=ua(t,"onChange"),0<t.length&&(i=new ts("onChange","change",null,i,n),e.push({event:i,listeners:t}))}var Ln=null,Qn=null;function jh(e){Tc(e,0)}function Pa(e){var t=Pi(e);if(Wp(t))return e}function Mh(e,t){if(e==="change")return t}var Sc=!1;xt&&(xt?(Dr="oninput"in document,Dr||(Mo=document.createElement("div"),Mo.setAttribute("oninput","return;"),Dr=typeof Mo.oninput=="function"),Mr=Dr):Mr=!1,Sc=Mr&&(!document.documentMode||9<document.documentMode));var Mr,Dr,Mo;function ep(){Ln&&(Ln.detachEvent("onpropertychange",Ic),Qn=Ln=null)}function Ic(e){if(e.propertyName==="value"&&Pa(Qn)){var t=[];kc(t,Qn,e,$l(e)),nc(jh,t)}}function Dh(e,t,i){e==="focusin"?(ep(),Ln=t,Qn=i,Ln.attachEvent("onpropertychange",Ic)):e==="focusout"&&ep()}function Fh(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Pa(Qn)}function Uh(e,t){if(e==="click")return Pa(t)}function Bh(e,t){if(e==="input"||e==="change")return Pa(t)}function Hh(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Ke=typeof Object.is=="function"?Object.is:Hh;function Gn(e,t){if(Ke(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var i=Object.keys(e),n=Object.keys(t);if(i.length!==n.length)return!1;for(n=0;n<i.length;n++){var r=i[n];if(!Xo.call(t,r)||!Ke(e[r],t[r]))return!1}return!0}function tp(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function ip(e,t){var i=tp(e);e=0;for(var n;i;){if(i.nodeType===3){if(n=e+i.textContent.length,e<=t&&n>=t)return{node:i,offset:t-e};e=n}e:{for(;i;){if(i.nextSibling){i=i.nextSibling;break e}i=i.parentNode}i=void 0}i=tp(i)}}function Ec(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Ec(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function _c(){for(var e=window,t=aa();t instanceof e.HTMLIFrameElement;){try{var i=typeof t.contentWindow.location.href=="string"}catch{i=!1}if(i)e=t.contentWindow;else break;t=aa(e.document)}return t}function rs(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function Vh(e){var t=_c(),i=e.focusedElem,n=e.selectionRange;if(t!==i&&i&&i.ownerDocument&&Ec(i.ownerDocument.documentElement,i)){if(n!==null&&rs(i)){if(t=n.start,e=n.end,e===void 0&&(e=t),"selectionStart"in i)i.selectionStart=t,i.selectionEnd=Math.min(e,i.value.length);else if(e=(t=i.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var r=i.textContent.length,a=Math.min(n.start,r);n=n.end===void 0?a:Math.min(n.end,r),!e.extend&&a>n&&(r=n,n=a,a=r),r=ip(i,a);var o=ip(i,n);r&&o&&(e.rangeCount!==1||e.anchorNode!==r.node||e.anchorOffset!==r.offset||e.focusNode!==o.node||e.focusOffset!==o.offset)&&(t=t.createRange(),t.setStart(r.node,r.offset),e.removeAllRanges(),a>n?(e.addRange(t),e.extend(o.node,o.offset)):(t.setEnd(o.node,o.offset),e.addRange(t)))}}for(t=[],e=i;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof i.focus=="function"&&i.focus(),i=0;i<t.length;i++)e=t[i],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Qh=xt&&"documentMode"in document&&11>=document.documentMode,Ni=null,hl=null,Tn=null,xl=!1;function np(e,t,i){var n=i.window===i?i.document:i.nodeType===9?i:i.ownerDocument;xl||Ni==null||Ni!==aa(n)||(n=Ni,"selectionStart"in n&&rs(n)?n={start:n.selectionStart,end:n.selectionEnd}:(n=(n.ownerDocument&&n.ownerDocument.defaultView||window).getSelection(),n={anchorNode:n.anchorNode,anchorOffset:n.anchorOffset,focusNode:n.focusNode,focusOffset:n.focusOffset}),Tn&&Gn(Tn,n)||(Tn=n,n=ua(hl,"onSelect"),0<n.length&&(t=new ts("onSelect","select",null,t,i),e.push({event:t,listeners:n}),t.target=Ni)))}function Fr(e,t){var i={};return i[e.toLowerCase()]=t.toLowerCase(),i["Webkit"+e]="webkit"+t,i["Moz"+e]="moz"+t,i}var zi={animationend:Fr("Animation","AnimationEnd"),animationiteration:Fr("Animation","AnimationIteration"),animationstart:Fr("Animation","AnimationStart"),transitionend:Fr("Transition","TransitionEnd")},Do={},Cc={};xt&&(Cc=document.createElement("div").style,"AnimationEvent"in window||(delete zi.animationend.animation,delete zi.animationiteration.animation,delete zi.animationstart.animation),"TransitionEvent"in window||delete zi.transitionend.transition);function La(e){if(Do[e])return Do[e];if(!zi[e])return e;var t=zi[e],i;for(i in t)if(t.hasOwnProperty(i)&&i in Cc)return Do[e]=t[i];return e}var Rc=La("animationend"),Nc=La("animationiteration"),zc=La("animationstart"),Pc=La("transitionend"),Lc=new Map,rp="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Vt(e,t){Lc.set(e,t),mi(t,[e])}for(Ur=0;Ur<rp.length;Ur++)Br=rp[Ur],ap=Br.toLowerCase(),op=Br[0].toUpperCase()+Br.slice(1),Vt(ap,"on"+op);var Br,ap,op,Ur;Vt(Rc,"onAnimationEnd");Vt(Nc,"onAnimationIteration");Vt(zc,"onAnimationStart");Vt("dblclick","onDoubleClick");Vt("focusin","onFocus");Vt("focusout","onBlur");Vt(Pc,"onTransitionEnd");Qi("onMouseEnter",["mouseout","mouseover"]);Qi("onMouseLeave",["mouseout","mouseover"]);Qi("onPointerEnter",["pointerout","pointerover"]);Qi("onPointerLeave",["pointerout","pointerover"]);mi("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));mi("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));mi("onBeforeInput",["compositionend","keypress","textInput","paste"]);mi("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));mi("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));mi("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Rn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Gh=new Set("cancel close invalid load scroll toggle".split(" ").concat(Rn));function lp(e,t,i){var n=e.type||"unknown-event";e.currentTarget=i,Gm(n,t,void 0,e),e.currentTarget=null}function Tc(e,t){t=(t&4)!==0;for(var i=0;i<e.length;i++){var n=e[i],r=n.event;n=n.listeners;e:{var a=void 0;if(t)for(var o=n.length-1;0<=o;o--){var l=n[o],s=l.instance,d=l.currentTarget;if(l=l.listener,s!==a&&r.isPropagationStopped())break e;lp(r,l,d),a=s}else for(o=0;o<n.length;o++){if(l=n[o],s=l.instance,d=l.currentTarget,l=l.listener,s!==a&&r.isPropagationStopped())break e;lp(r,l,d),a=s}}}if(la)throw e=ul,la=!1,ul=null,e}function Q(e,t){var i=t[kl];i===void 0&&(i=t[kl]=new Set);var n=e+"__bubble";i.has(n)||(Ac(t,e,2,!1),i.add(n))}function Fo(e,t,i){var n=0;t&&(n|=4),Ac(i,e,n,t)}var Hr="_reactListening"+Math.random().toString(36).slice(2);function Wn(e){if(!e[Hr]){e[Hr]=!0,Bp.forEach(function(i){i!=="selectionchange"&&(Gh.has(i)||Fo(i,!1,e),Fo(i,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Hr]||(t[Hr]=!0,Fo("selectionchange",!1,t))}}function Ac(e,t,i,n){switch(xc(t)){case 1:var r=lh;break;case 4:r=sh;break;default:r=Jl}i=r.bind(null,t,i,e),r=void 0,!cl||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(r=!0),n?r!==void 0?e.addEventListener(t,i,{capture:!0,passive:r}):e.addEventListener(t,i,!0):r!==void 0?e.addEventListener(t,i,{passive:r}):e.addEventListener(t,i,!1)}function Uo(e,t,i,n,r){var a=n;if((t&1)===0&&(t&2)===0&&n!==null)e:for(;;){if(n===null)return;var o=n.tag;if(o===3||o===4){var l=n.stateNode.containerInfo;if(l===r||l.nodeType===8&&l.parentNode===r)break;if(o===4)for(o=n.return;o!==null;){var s=o.tag;if((s===3||s===4)&&(s=o.stateNode.containerInfo,s===r||s.nodeType===8&&s.parentNode===r))return;o=o.return}for(;l!==null;){if(o=ai(l),o===null)return;if(s=o.tag,s===5||s===6){n=a=o;continue e}l=l.parentNode}}n=n.return}nc(function(){var d=a,u=$l(i),h=[];e:{var p=Lc.get(e);if(p!==void 0){var x=ts,v=e;switch(e){case"keypress":if(Xr(i)===0)break e;case"keydown":case"keyup":x=Sh;break;case"focusin":v="focus",x=jo;break;case"focusout":v="blur",x=jo;break;case"beforeblur":case"afterblur":x=jo;break;case"click":if(i.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":x=Kd;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":x=ch;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":x=_h;break;case Rc:case Nc:case zc:x=gh;break;case Pc:x=Rh;break;case"scroll":x=dh;break;case"wheel":x=zh;break;case"copy":case"cut":case"paste":x=hh;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":x=Yd}var g=(t&4)!==0,k=!g&&e==="scroll",f=g?p!==null?p+"Capture":null:p;g=[];for(var c=d,m;c!==null;){m=c;var y=m.stateNode;if(m.tag===5&&y!==null&&(m=y,f!==null&&(y=Un(c,f),y!=null&&g.push(qn(c,y,m)))),k)break;c=c.return}0<g.length&&(p=new x(p,v,null,i,u),h.push({event:p,listeners:g}))}}if((t&7)===0){e:{if(p=e==="mouseover"||e==="pointerover",x=e==="mouseout"||e==="pointerout",p&&i!==dl&&(v=i.relatedTarget||i.fromElement)&&(ai(v)||v[vt]))break e;if((x||p)&&(p=u.window===u?u:(p=u.ownerDocument)?p.defaultView||p.parentWindow:window,x?(v=i.relatedTarget||i.toElement,x=d,v=v?ai(v):null,v!==null&&(k=hi(v),v!==k||v.tag!==5&&v.tag!==6)&&(v=null)):(x=null,v=d),x!==v)){if(g=Kd,y="onMouseLeave",f="onMouseEnter",c="mouse",(e==="pointerout"||e==="pointerover")&&(g=Yd,y="onPointerLeave",f="onPointerEnter",c="pointer"),k=x==null?p:Pi(x),m=v==null?p:Pi(v),p=new g(y,c+"leave",x,i,u),p.target=k,p.relatedTarget=m,y=null,ai(u)===d&&(g=new g(f,c+"enter",v,i,u),g.target=m,g.relatedTarget=k,y=g),k=y,x&&v)t:{for(g=x,f=v,c=0,m=g;m;m=Ei(m))c++;for(m=0,y=f;y;y=Ei(y))m++;for(;0<c-m;)g=Ei(g),c--;for(;0<m-c;)f=Ei(f),m--;for(;c--;){if(g===f||f!==null&&g===f.alternate)break t;g=Ei(g),f=Ei(f)}g=null}else g=null;x!==null&&sp(h,p,x,g,!1),v!==null&&k!==null&&sp(h,k,v,g,!0)}}e:{if(p=d?Pi(d):window,x=p.nodeName&&p.nodeName.toLowerCase(),x==="select"||x==="input"&&p.type==="file")var S=Mh;else if(Jd(p))if(Sc)S=Bh;else{S=Fh;var E=Dh}else(x=p.nodeName)&&x.toLowerCase()==="input"&&(p.type==="checkbox"||p.type==="radio")&&(S=Uh);if(S&&(S=S(e,d))){kc(h,S,i,u);break e}E&&E(e,p,d),e==="focusout"&&(E=p._wrapperState)&&E.controlled&&p.type==="number"&&rl(p,"number",p.value)}switch(E=d?Pi(d):window,e){case"focusin":(Jd(E)||E.contentEditable==="true")&&(Ni=E,hl=d,Tn=null);break;case"focusout":Tn=hl=Ni=null;break;case"mousedown":xl=!0;break;case"contextmenu":case"mouseup":case"dragend":xl=!1,np(h,i,u);break;case"selectionchange":if(Qh)break;case"keydown":case"keyup":np(h,i,u)}var R;if(ns)e:{switch(e){case"compositionstart":var L="onCompositionStart";break e;case"compositionend":L="onCompositionEnd";break e;case"compositionupdate":L="onCompositionUpdate";break e}L=void 0}else Ri?bc(e,i)&&(L="onCompositionEnd"):e==="keydown"&&i.keyCode===229&&(L="onCompositionStart");L&&(yc&&i.locale!=="ko"&&(Ri||L!=="onCompositionStart"?L==="onCompositionEnd"&&Ri&&(R=vc()):(Pt=u,es="value"in Pt?Pt.value:Pt.textContent,Ri=!0)),E=ua(d,L),0<E.length&&(L=new $d(L,e,null,i,u),h.push({event:L,listeners:E}),R?L.data=R:(R=wc(i),R!==null&&(L.data=R)))),(R=Lh?Th(e,i):Ah(e,i))&&(d=ua(d,"onBeforeInput"),0<d.length&&(u=new $d("onBeforeInput","beforeinput",null,i,u),h.push({event:u,listeners:d}),u.data=R))}Tc(h,t)})}function qn(e,t,i){return{instance:e,listener:t,currentTarget:i}}function ua(e,t){for(var i=t+"Capture",n=[];e!==null;){var r=e,a=r.stateNode;r.tag===5&&a!==null&&(r=a,a=Un(e,i),a!=null&&n.unshift(qn(e,a,r)),a=Un(e,t),a!=null&&n.push(qn(e,a,r))),e=e.return}return n}function Ei(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function sp(e,t,i,n,r){for(var a=t._reactName,o=[];i!==null&&i!==n;){var l=i,s=l.alternate,d=l.stateNode;if(s!==null&&s===n)break;l.tag===5&&d!==null&&(l=d,r?(s=Un(i,a),s!=null&&o.unshift(qn(i,s,l))):r||(s=Un(i,a),s!=null&&o.push(qn(i,s,l)))),i=i.return}o.length!==0&&e.push({event:t,listeners:o})}var Wh=/\r\n?/g,qh=/\u0000|\uFFFD/g;function dp(e){return(typeof e=="string"?e:""+e).replace(Wh,`
`).replace(qh,"")}function Vr(e,t,i){if(t=dp(t),dp(e)!==t&&i)throw Error(w(425))}function fa(){}var vl=null,yl=null;function bl(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var wl=typeof setTimeout=="function"?setTimeout:void 0,Kh=typeof clearTimeout=="function"?clearTimeout:void 0,pp=typeof Promise=="function"?Promise:void 0,$h=typeof queueMicrotask=="function"?queueMicrotask:typeof pp<"u"?function(e){return pp.resolve(null).then(e).catch(Yh)}:wl;function Yh(e){setTimeout(function(){throw e})}function Bo(e,t){var i=t,n=0;do{var r=i.nextSibling;if(e.removeChild(i),r&&r.nodeType===8)if(i=r.data,i==="/$"){if(n===0){e.removeChild(r),Vn(t);return}n--}else i!=="$"&&i!=="$?"&&i!=="$!"||n++;i=r}while(i);Vn(t)}function jt(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function cp(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var i=e.data;if(i==="$"||i==="$!"||i==="$?"){if(t===0)return e;t--}else i==="/$"&&t++}e=e.previousSibling}return null}var Zi=Math.random().toString(36).slice(2),et="__reactFiber$"+Zi,Kn="__reactProps$"+Zi,vt="__reactContainer$"+Zi,kl="__reactEvents$"+Zi,Xh="__reactListeners$"+Zi,Zh="__reactHandles$"+Zi;function ai(e){var t=e[et];if(t)return t;for(var i=e.parentNode;i;){if(t=i[vt]||i[et]){if(i=t.alternate,t.child!==null||i!==null&&i.child!==null)for(e=cp(e);e!==null;){if(i=e[et])return i;e=cp(e)}return t}e=i,i=e.parentNode}return null}function nr(e){return e=e[et]||e[vt],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Pi(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(w(33))}function Ta(e){return e[Kn]||null}var Sl=[],Li=-1;function Qt(e){return{current:e}}function G(e){0>Li||(e.current=Sl[Li],Sl[Li]=null,Li--)}function V(e,t){Li++,Sl[Li]=e.current,e.current=t}var Ht={},me=Qt(Ht),ke=Qt(!1),pi=Ht;function Gi(e,t){var i=e.type.contextTypes;if(!i)return Ht;var n=e.stateNode;if(n&&n.__reactInternalMemoizedUnmaskedChildContext===t)return n.__reactInternalMemoizedMaskedChildContext;var r={},a;for(a in i)r[a]=t[a];return n&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=r),r}function Se(e){return e=e.childContextTypes,e!=null}function ga(){G(ke),G(me)}function up(e,t,i){if(me.current!==Ht)throw Error(w(168));V(me,t),V(ke,i)}function Oc(e,t,i){var n=e.stateNode;if(t=t.childContextTypes,typeof n.getChildContext!="function")return i;n=n.getChildContext();for(var r in n)if(!(r in t))throw Error(w(108,Dm(e)||"Unknown",r));return X({},i,n)}function ma(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||Ht,pi=me.current,V(me,e),V(ke,ke.current),!0}function fp(e,t,i){var n=e.stateNode;if(!n)throw Error(w(169));i?(e=Oc(e,t,pi),n.__reactInternalMemoizedMergedChildContext=e,G(ke),G(me),V(me,e)):G(ke),V(ke,i)}var ft=null,Aa=!1,Ho=!1;function jc(e){ft===null?ft=[e]:ft.push(e)}function Jh(e){Aa=!0,jc(e)}function Gt(){if(!Ho&&ft!==null){Ho=!0;var e=0,t=F;try{var i=ft;for(F=1;e<i.length;e++){var n=i[e];do n=n(!0);while(n!==null)}ft=null,Aa=!1}catch(r){throw ft!==null&&(ft=ft.slice(e+1)),lc(Yl,Gt),r}finally{F=t,Ho=!1}}return null}var Ti=[],Ai=0,ha=null,xa=0,Ae=[],Oe=0,ci=null,gt=1,mt="";function ni(e,t){Ti[Ai++]=xa,Ti[Ai++]=ha,ha=e,xa=t}function Mc(e,t,i){Ae[Oe++]=gt,Ae[Oe++]=mt,Ae[Oe++]=ci,ci=e;var n=gt;e=mt;var r=32-We(n)-1;n&=~(1<<r),i+=1;var a=32-We(t)+r;if(30<a){var o=r-r%5;a=(n&(1<<o)-1).toString(32),n>>=o,r-=o,gt=1<<32-We(t)+r|i<<r|n,mt=a+e}else gt=1<<a|i<<r|n,mt=e}function as(e){e.return!==null&&(ni(e,1),Mc(e,1,0))}function os(e){for(;e===ha;)ha=Ti[--Ai],Ti[Ai]=null,xa=Ti[--Ai],Ti[Ai]=null;for(;e===ci;)ci=Ae[--Oe],Ae[Oe]=null,mt=Ae[--Oe],Ae[Oe]=null,gt=Ae[--Oe],Ae[Oe]=null}var Ce=null,_e=null,q=!1,Ge=null;function Dc(e,t){var i=je(5,null,null,0);i.elementType="DELETED",i.stateNode=t,i.return=e,t=e.deletions,t===null?(e.deletions=[i],e.flags|=16):t.push(i)}function gp(e,t){switch(e.tag){case 5:var i=e.type;return t=t.nodeType!==1||i.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,Ce=e,_e=jt(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,Ce=e,_e=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(i=ci!==null?{id:gt,overflow:mt}:null,e.memoizedState={dehydrated:t,treeContext:i,retryLane:1073741824},i=je(18,null,null,0),i.stateNode=t,i.return=e,e.child=i,Ce=e,_e=null,!0):!1;default:return!1}}function Il(e){return(e.mode&1)!==0&&(e.flags&128)===0}function El(e){if(q){var t=_e;if(t){var i=t;if(!gp(e,t)){if(Il(e))throw Error(w(418));t=jt(i.nextSibling);var n=Ce;t&&gp(e,t)?Dc(n,i):(e.flags=e.flags&-4097|2,q=!1,Ce=e)}}else{if(Il(e))throw Error(w(418));e.flags=e.flags&-4097|2,q=!1,Ce=e}}}function mp(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;Ce=e}function Qr(e){if(e!==Ce)return!1;if(!q)return mp(e),q=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!bl(e.type,e.memoizedProps)),t&&(t=_e)){if(Il(e))throw Fc(),Error(w(418));for(;t;)Dc(e,t),t=jt(t.nextSibling)}if(mp(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(w(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var i=e.data;if(i==="/$"){if(t===0){_e=jt(e.nextSibling);break e}t--}else i!=="$"&&i!=="$!"&&i!=="$?"||t++}e=e.nextSibling}_e=null}}else _e=Ce?jt(e.stateNode.nextSibling):null;return!0}function Fc(){for(var e=_e;e;)e=jt(e.nextSibling)}function Wi(){_e=Ce=null,q=!1}function ls(e){Ge===null?Ge=[e]:Ge.push(e)}var ex=wt.ReactCurrentBatchConfig;function wn(e,t,i){if(e=i.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(i._owner){if(i=i._owner,i){if(i.tag!==1)throw Error(w(309));var n=i.stateNode}if(!n)throw Error(w(147,e));var r=n,a=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===a?t.ref:(t=function(o){var l=r.refs;o===null?delete l[a]:l[a]=o},t._stringRef=a,t)}if(typeof e!="string")throw Error(w(284));if(!i._owner)throw Error(w(290,e))}return e}function Gr(e,t){throw e=Object.prototype.toString.call(t),Error(w(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function hp(e){var t=e._init;return t(e._payload)}function Uc(e){function t(f,c){if(e){var m=f.deletions;m===null?(f.deletions=[c],f.flags|=16):m.push(c)}}function i(f,c){if(!e)return null;for(;c!==null;)t(f,c),c=c.sibling;return null}function n(f,c){for(f=new Map;c!==null;)c.key!==null?f.set(c.key,c):f.set(c.index,c),c=c.sibling;return f}function r(f,c){return f=Ut(f,c),f.index=0,f.sibling=null,f}function a(f,c,m){return f.index=m,e?(m=f.alternate,m!==null?(m=m.index,m<c?(f.flags|=2,c):m):(f.flags|=2,c)):(f.flags|=1048576,c)}function o(f){return e&&f.alternate===null&&(f.flags|=2),f}function l(f,c,m,y){return c===null||c.tag!==6?(c=$o(m,f.mode,y),c.return=f,c):(c=r(c,m),c.return=f,c)}function s(f,c,m,y){var S=m.type;return S===Ci?u(f,c,m.props.children,y,m.key):c!==null&&(c.elementType===S||typeof S=="object"&&S!==null&&S.$$typeof===Ct&&hp(S)===c.type)?(y=r(c,m.props),y.ref=wn(f,c,m),y.return=f,y):(y=ra(m.type,m.key,m.props,null,f.mode,y),y.ref=wn(f,c,m),y.return=f,y)}function d(f,c,m,y){return c===null||c.tag!==4||c.stateNode.containerInfo!==m.containerInfo||c.stateNode.implementation!==m.implementation?(c=Yo(m,f.mode,y),c.return=f,c):(c=r(c,m.children||[]),c.return=f,c)}function u(f,c,m,y,S){return c===null||c.tag!==7?(c=di(m,f.mode,y,S),c.return=f,c):(c=r(c,m),c.return=f,c)}function h(f,c,m){if(typeof c=="string"&&c!==""||typeof c=="number")return c=$o(""+c,f.mode,m),c.return=f,c;if(typeof c=="object"&&c!==null){switch(c.$$typeof){case zr:return m=ra(c.type,c.key,c.props,null,f.mode,m),m.ref=wn(f,null,c),m.return=f,m;case _i:return c=Yo(c,f.mode,m),c.return=f,c;case Ct:var y=c._init;return h(f,y(c._payload),m)}if(_n(c)||xn(c))return c=di(c,f.mode,m,null),c.return=f,c;Gr(f,c)}return null}function p(f,c,m,y){var S=c!==null?c.key:null;if(typeof m=="string"&&m!==""||typeof m=="number")return S!==null?null:l(f,c,""+m,y);if(typeof m=="object"&&m!==null){switch(m.$$typeof){case zr:return m.key===S?s(f,c,m,y):null;case _i:return m.key===S?d(f,c,m,y):null;case Ct:return S=m._init,p(f,c,S(m._payload),y)}if(_n(m)||xn(m))return S!==null?null:u(f,c,m,y,null);Gr(f,m)}return null}function x(f,c,m,y,S){if(typeof y=="string"&&y!==""||typeof y=="number")return f=f.get(m)||null,l(c,f,""+y,S);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case zr:return f=f.get(y.key===null?m:y.key)||null,s(c,f,y,S);case _i:return f=f.get(y.key===null?m:y.key)||null,d(c,f,y,S);case Ct:var E=y._init;return x(f,c,m,E(y._payload),S)}if(_n(y)||xn(y))return f=f.get(m)||null,u(c,f,y,S,null);Gr(c,y)}return null}function v(f,c,m,y){for(var S=null,E=null,R=c,L=c=0,J=null;R!==null&&L<m.length;L++){R.index>L?(J=R,R=null):J=R.sibling;var T=p(f,R,m[L],y);if(T===null){R===null&&(R=J);break}e&&R&&T.alternate===null&&t(f,R),c=a(T,c,L),E===null?S=T:E.sibling=T,E=T,R=J}if(L===m.length)return i(f,R),q&&ni(f,L),S;if(R===null){for(;L<m.length;L++)R=h(f,m[L],y),R!==null&&(c=a(R,c,L),E===null?S=R:E.sibling=R,E=R);return q&&ni(f,L),S}for(R=n(f,R);L<m.length;L++)J=x(R,f,L,m[L],y),J!==null&&(e&&J.alternate!==null&&R.delete(J.key===null?L:J.key),c=a(J,c,L),E===null?S=J:E.sibling=J,E=J);return e&&R.forEach(function(Ue){return t(f,Ue)}),q&&ni(f,L),S}function g(f,c,m,y){var S=xn(m);if(typeof S!="function")throw Error(w(150));if(m=S.call(m),m==null)throw Error(w(151));for(var E=S=null,R=c,L=c=0,J=null,T=m.next();R!==null&&!T.done;L++,T=m.next()){R.index>L?(J=R,R=null):J=R.sibling;var Ue=p(f,R,T.value,y);if(Ue===null){R===null&&(R=J);break}e&&R&&Ue.alternate===null&&t(f,R),c=a(Ue,c,L),E===null?S=Ue:E.sibling=Ue,E=Ue,R=J}if(T.done)return i(f,R),q&&ni(f,L),S;if(R===null){for(;!T.done;L++,T=m.next())T=h(f,T.value,y),T!==null&&(c=a(T,c,L),E===null?S=T:E.sibling=T,E=T);return q&&ni(f,L),S}for(R=n(f,R);!T.done;L++,T=m.next())T=x(R,f,L,T.value,y),T!==null&&(e&&T.alternate!==null&&R.delete(T.key===null?L:T.key),c=a(T,c,L),E===null?S=T:E.sibling=T,E=T);return e&&R.forEach(function(co){return t(f,co)}),q&&ni(f,L),S}function k(f,c,m,y){if(typeof m=="object"&&m!==null&&m.type===Ci&&m.key===null&&(m=m.props.children),typeof m=="object"&&m!==null){switch(m.$$typeof){case zr:e:{for(var S=m.key,E=c;E!==null;){if(E.key===S){if(S=m.type,S===Ci){if(E.tag===7){i(f,E.sibling),c=r(E,m.props.children),c.return=f,f=c;break e}}else if(E.elementType===S||typeof S=="object"&&S!==null&&S.$$typeof===Ct&&hp(S)===E.type){i(f,E.sibling),c=r(E,m.props),c.ref=wn(f,E,m),c.return=f,f=c;break e}i(f,E);break}else t(f,E);E=E.sibling}m.type===Ci?(c=di(m.props.children,f.mode,y,m.key),c.return=f,f=c):(y=ra(m.type,m.key,m.props,null,f.mode,y),y.ref=wn(f,c,m),y.return=f,f=y)}return o(f);case _i:e:{for(E=m.key;c!==null;){if(c.key===E)if(c.tag===4&&c.stateNode.containerInfo===m.containerInfo&&c.stateNode.implementation===m.implementation){i(f,c.sibling),c=r(c,m.children||[]),c.return=f,f=c;break e}else{i(f,c);break}else t(f,c);c=c.sibling}c=Yo(m,f.mode,y),c.return=f,f=c}return o(f);case Ct:return E=m._init,k(f,c,E(m._payload),y)}if(_n(m))return v(f,c,m,y);if(xn(m))return g(f,c,m,y);Gr(f,m)}return typeof m=="string"&&m!==""||typeof m=="number"?(m=""+m,c!==null&&c.tag===6?(i(f,c.sibling),c=r(c,m),c.return=f,f=c):(i(f,c),c=$o(m,f.mode,y),c.return=f,f=c),o(f)):i(f,c)}return k}var qi=Uc(!0),Bc=Uc(!1),va=Qt(null),ya=null,Oi=null,ss=null;function ds(){ss=Oi=ya=null}function ps(e){var t=va.current;G(va),e._currentValue=t}function _l(e,t,i){for(;e!==null;){var n=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,n!==null&&(n.childLanes|=t)):n!==null&&(n.childLanes&t)!==t&&(n.childLanes|=t),e===i)break;e=e.return}}function Hi(e,t){ya=e,ss=Oi=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&t)!==0&&(we=!0),e.firstContext=null)}function De(e){var t=e._currentValue;if(ss!==e)if(e={context:e,memoizedValue:t,next:null},Oi===null){if(ya===null)throw Error(w(308));Oi=e,ya.dependencies={lanes:0,firstContext:e}}else Oi=Oi.next=e;return t}var oi=null;function cs(e){oi===null?oi=[e]:oi.push(e)}function Hc(e,t,i,n){var r=t.interleaved;return r===null?(i.next=i,cs(t)):(i.next=r.next,r.next=i),t.interleaved=i,yt(e,n)}function yt(e,t){e.lanes|=t;var i=e.alternate;for(i!==null&&(i.lanes|=t),i=e,e=e.return;e!==null;)e.childLanes|=t,i=e.alternate,i!==null&&(i.childLanes|=t),i=e,e=e.return;return i.tag===3?i.stateNode:null}var Rt=!1;function us(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Vc(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function ht(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function Mt(e,t,i){var n=e.updateQueue;if(n===null)return null;if(n=n.shared,(j&2)!==0){var r=n.pending;return r===null?t.next=t:(t.next=r.next,r.next=t),n.pending=t,yt(e,i)}return r=n.interleaved,r===null?(t.next=t,cs(n)):(t.next=r.next,r.next=t),n.interleaved=t,yt(e,i)}function Zr(e,t,i){if(t=t.updateQueue,t!==null&&(t=t.shared,(i&4194240)!==0)){var n=t.lanes;n&=e.pendingLanes,i|=n,t.lanes=i,Xl(e,i)}}function xp(e,t){var i=e.updateQueue,n=e.alternate;if(n!==null&&(n=n.updateQueue,i===n)){var r=null,a=null;if(i=i.firstBaseUpdate,i!==null){do{var o={eventTime:i.eventTime,lane:i.lane,tag:i.tag,payload:i.payload,callback:i.callback,next:null};a===null?r=a=o:a=a.next=o,i=i.next}while(i!==null);a===null?r=a=t:a=a.next=t}else r=a=t;i={baseState:n.baseState,firstBaseUpdate:r,lastBaseUpdate:a,shared:n.shared,effects:n.effects},e.updateQueue=i;return}e=i.lastBaseUpdate,e===null?i.firstBaseUpdate=t:e.next=t,i.lastBaseUpdate=t}function ba(e,t,i,n){var r=e.updateQueue;Rt=!1;var a=r.firstBaseUpdate,o=r.lastBaseUpdate,l=r.shared.pending;if(l!==null){r.shared.pending=null;var s=l,d=s.next;s.next=null,o===null?a=d:o.next=d,o=s;var u=e.alternate;u!==null&&(u=u.updateQueue,l=u.lastBaseUpdate,l!==o&&(l===null?u.firstBaseUpdate=d:l.next=d,u.lastBaseUpdate=s))}if(a!==null){var h=r.baseState;o=0,u=d=s=null,l=a;do{var p=l.lane,x=l.eventTime;if((n&p)===p){u!==null&&(u=u.next={eventTime:x,lane:0,tag:l.tag,payload:l.payload,callback:l.callback,next:null});e:{var v=e,g=l;switch(p=t,x=i,g.tag){case 1:if(v=g.payload,typeof v=="function"){h=v.call(x,h,p);break e}h=v;break e;case 3:v.flags=v.flags&-65537|128;case 0:if(v=g.payload,p=typeof v=="function"?v.call(x,h,p):v,p==null)break e;h=X({},h,p);break e;case 2:Rt=!0}}l.callback!==null&&l.lane!==0&&(e.flags|=64,p=r.effects,p===null?r.effects=[l]:p.push(l))}else x={eventTime:x,lane:p,tag:l.tag,payload:l.payload,callback:l.callback,next:null},u===null?(d=u=x,s=h):u=u.next=x,o|=p;if(l=l.next,l===null){if(l=r.shared.pending,l===null)break;p=l,l=p.next,p.next=null,r.lastBaseUpdate=p,r.shared.pending=null}}while(!0);if(u===null&&(s=h),r.baseState=s,r.firstBaseUpdate=d,r.lastBaseUpdate=u,t=r.shared.interleaved,t!==null){r=t;do o|=r.lane,r=r.next;while(r!==t)}else a===null&&(r.shared.lanes=0);fi|=o,e.lanes=o,e.memoizedState=h}}function vp(e,t,i){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var n=e[t],r=n.callback;if(r!==null){if(n.callback=null,n=i,typeof r!="function")throw Error(w(191,r));r.call(n)}}}var rr={},it=Qt(rr),$n=Qt(rr),Yn=Qt(rr);function li(e){if(e===rr)throw Error(w(174));return e}function fs(e,t){switch(V(Yn,t),V($n,e),V(it,rr),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:ol(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=ol(t,e)}G(it),V(it,t)}function Ki(){G(it),G($n),G(Yn)}function Qc(e){li(Yn.current);var t=li(it.current),i=ol(t,e.type);t!==i&&(V($n,e),V(it,i))}function gs(e){$n.current===e&&(G(it),G($n))}var $=Qt(0);function wa(e){for(var t=e;t!==null;){if(t.tag===13){var i=t.memoizedState;if(i!==null&&(i=i.dehydrated,i===null||i.data==="$?"||i.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Vo=[];function ms(){for(var e=0;e<Vo.length;e++)Vo[e]._workInProgressVersionPrimary=null;Vo.length=0}var Jr=wt.ReactCurrentDispatcher,Qo=wt.ReactCurrentBatchConfig,ui=0,Y=null,re=null,oe=null,ka=!1,An=!1,Xn=0,tx=0;function ue(){throw Error(w(321))}function hs(e,t){if(t===null)return!1;for(var i=0;i<t.length&&i<e.length;i++)if(!Ke(e[i],t[i]))return!1;return!0}function xs(e,t,i,n,r,a){if(ui=a,Y=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Jr.current=e===null||e.memoizedState===null?ax:ox,e=i(n,r),An){a=0;do{if(An=!1,Xn=0,25<=a)throw Error(w(301));a+=1,oe=re=null,t.updateQueue=null,Jr.current=lx,e=i(n,r)}while(An)}if(Jr.current=Sa,t=re!==null&&re.next!==null,ui=0,oe=re=Y=null,ka=!1,t)throw Error(w(300));return e}function vs(){var e=Xn!==0;return Xn=0,e}function Je(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return oe===null?Y.memoizedState=oe=e:oe=oe.next=e,oe}function Fe(){if(re===null){var e=Y.alternate;e=e!==null?e.memoizedState:null}else e=re.next;var t=oe===null?Y.memoizedState:oe.next;if(t!==null)oe=t,re=e;else{if(e===null)throw Error(w(310));re=e,e={memoizedState:re.memoizedState,baseState:re.baseState,baseQueue:re.baseQueue,queue:re.queue,next:null},oe===null?Y.memoizedState=oe=e:oe=oe.next=e}return oe}function Zn(e,t){return typeof t=="function"?t(e):t}function Go(e){var t=Fe(),i=t.queue;if(i===null)throw Error(w(311));i.lastRenderedReducer=e;var n=re,r=n.baseQueue,a=i.pending;if(a!==null){if(r!==null){var o=r.next;r.next=a.next,a.next=o}n.baseQueue=r=a,i.pending=null}if(r!==null){a=r.next,n=n.baseState;var l=o=null,s=null,d=a;do{var u=d.lane;if((ui&u)===u)s!==null&&(s=s.next={lane:0,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null}),n=d.hasEagerState?d.eagerState:e(n,d.action);else{var h={lane:u,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null};s===null?(l=s=h,o=n):s=s.next=h,Y.lanes|=u,fi|=u}d=d.next}while(d!==null&&d!==a);s===null?o=n:s.next=l,Ke(n,t.memoizedState)||(we=!0),t.memoizedState=n,t.baseState=o,t.baseQueue=s,i.lastRenderedState=n}if(e=i.interleaved,e!==null){r=e;do a=r.lane,Y.lanes|=a,fi|=a,r=r.next;while(r!==e)}else r===null&&(i.lanes=0);return[t.memoizedState,i.dispatch]}function Wo(e){var t=Fe(),i=t.queue;if(i===null)throw Error(w(311));i.lastRenderedReducer=e;var n=i.dispatch,r=i.pending,a=t.memoizedState;if(r!==null){i.pending=null;var o=r=r.next;do a=e(a,o.action),o=o.next;while(o!==r);Ke(a,t.memoizedState)||(we=!0),t.memoizedState=a,t.baseQueue===null&&(t.baseState=a),i.lastRenderedState=a}return[a,n]}function Gc(){}function Wc(e,t){var i=Y,n=Fe(),r=t(),a=!Ke(n.memoizedState,r);if(a&&(n.memoizedState=r,we=!0),n=n.queue,ys($c.bind(null,i,n,e),[e]),n.getSnapshot!==t||a||oe!==null&&oe.memoizedState.tag&1){if(i.flags|=2048,Jn(9,Kc.bind(null,i,n,r,t),void 0,null),le===null)throw Error(w(349));(ui&30)!==0||qc(i,t,r)}return r}function qc(e,t,i){e.flags|=16384,e={getSnapshot:t,value:i},t=Y.updateQueue,t===null?(t={lastEffect:null,stores:null},Y.updateQueue=t,t.stores=[e]):(i=t.stores,i===null?t.stores=[e]:i.push(e))}function Kc(e,t,i,n){t.value=i,t.getSnapshot=n,Yc(t)&&Xc(e)}function $c(e,t,i){return i(function(){Yc(t)&&Xc(e)})}function Yc(e){var t=e.getSnapshot;e=e.value;try{var i=t();return!Ke(e,i)}catch{return!0}}function Xc(e){var t=yt(e,1);t!==null&&qe(t,e,1,-1)}function yp(e){var t=Je();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Zn,lastRenderedState:e},t.queue=e,e=e.dispatch=rx.bind(null,Y,e),[t.memoizedState,e]}function Jn(e,t,i,n){return e={tag:e,create:t,destroy:i,deps:n,next:null},t=Y.updateQueue,t===null?(t={lastEffect:null,stores:null},Y.updateQueue=t,t.lastEffect=e.next=e):(i=t.lastEffect,i===null?t.lastEffect=e.next=e:(n=i.next,i.next=e,e.next=n,t.lastEffect=e)),e}function Zc(){return Fe().memoizedState}function ea(e,t,i,n){var r=Je();Y.flags|=e,r.memoizedState=Jn(1|t,i,void 0,n===void 0?null:n)}function Oa(e,t,i,n){var r=Fe();n=n===void 0?null:n;var a=void 0;if(re!==null){var o=re.memoizedState;if(a=o.destroy,n!==null&&hs(n,o.deps)){r.memoizedState=Jn(t,i,a,n);return}}Y.flags|=e,r.memoizedState=Jn(1|t,i,a,n)}function bp(e,t){return ea(8390656,8,e,t)}function ys(e,t){return Oa(2048,8,e,t)}function Jc(e,t){return Oa(4,2,e,t)}function eu(e,t){return Oa(4,4,e,t)}function tu(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function iu(e,t,i){return i=i!=null?i.concat([e]):null,Oa(4,4,tu.bind(null,t,e),i)}function bs(){}function nu(e,t){var i=Fe();t=t===void 0?null:t;var n=i.memoizedState;return n!==null&&t!==null&&hs(t,n[1])?n[0]:(i.memoizedState=[e,t],e)}function ru(e,t){var i=Fe();t=t===void 0?null:t;var n=i.memoizedState;return n!==null&&t!==null&&hs(t,n[1])?n[0]:(e=e(),i.memoizedState=[e,t],e)}function au(e,t,i){return(ui&21)===0?(e.baseState&&(e.baseState=!1,we=!0),e.memoizedState=i):(Ke(i,t)||(i=pc(),Y.lanes|=i,fi|=i,e.baseState=!0),t)}function ix(e,t){var i=F;F=i!==0&&4>i?i:4,e(!0);var n=Qo.transition;Qo.transition={};try{e(!1),t()}finally{F=i,Qo.transition=n}}function ou(){return Fe().memoizedState}function nx(e,t,i){var n=Ft(e);if(i={lane:n,action:i,hasEagerState:!1,eagerState:null,next:null},lu(e))su(t,i);else if(i=Hc(e,t,i,n),i!==null){var r=ve();qe(i,e,n,r),du(i,t,n)}}function rx(e,t,i){var n=Ft(e),r={lane:n,action:i,hasEagerState:!1,eagerState:null,next:null};if(lu(e))su(t,r);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,l=a(o,i);if(r.hasEagerState=!0,r.eagerState=l,Ke(l,o)){var s=t.interleaved;s===null?(r.next=r,cs(t)):(r.next=s.next,s.next=r),t.interleaved=r;return}}catch{}i=Hc(e,t,r,n),i!==null&&(r=ve(),qe(i,e,n,r),du(i,t,n))}}function lu(e){var t=e.alternate;return e===Y||t!==null&&t===Y}function su(e,t){An=ka=!0;var i=e.pending;i===null?t.next=t:(t.next=i.next,i.next=t),e.pending=t}function du(e,t,i){if((i&4194240)!==0){var n=t.lanes;n&=e.pendingLanes,i|=n,t.lanes=i,Xl(e,i)}}var Sa={readContext:De,useCallback:ue,useContext:ue,useEffect:ue,useImperativeHandle:ue,useInsertionEffect:ue,useLayoutEffect:ue,useMemo:ue,useReducer:ue,useRef:ue,useState:ue,useDebugValue:ue,useDeferredValue:ue,useTransition:ue,useMutableSource:ue,useSyncExternalStore:ue,useId:ue,unstable_isNewReconciler:!1},ax={readContext:De,useCallback:function(e,t){return Je().memoizedState=[e,t===void 0?null:t],e},useContext:De,useEffect:bp,useImperativeHandle:function(e,t,i){return i=i!=null?i.concat([e]):null,ea(4194308,4,tu.bind(null,t,e),i)},useLayoutEffect:function(e,t){return ea(4194308,4,e,t)},useInsertionEffect:function(e,t){return ea(4,2,e,t)},useMemo:function(e,t){var i=Je();return t=t===void 0?null:t,e=e(),i.memoizedState=[e,t],e},useReducer:function(e,t,i){var n=Je();return t=i!==void 0?i(t):t,n.memoizedState=n.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},n.queue=e,e=e.dispatch=nx.bind(null,Y,e),[n.memoizedState,e]},useRef:function(e){var t=Je();return e={current:e},t.memoizedState=e},useState:yp,useDebugValue:bs,useDeferredValue:function(e){return Je().memoizedState=e},useTransition:function(){var e=yp(!1),t=e[0];return e=ix.bind(null,e[1]),Je().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,i){var n=Y,r=Je();if(q){if(i===void 0)throw Error(w(407));i=i()}else{if(i=t(),le===null)throw Error(w(349));(ui&30)!==0||qc(n,t,i)}r.memoizedState=i;var a={value:i,getSnapshot:t};return r.queue=a,bp($c.bind(null,n,a,e),[e]),n.flags|=2048,Jn(9,Kc.bind(null,n,a,i,t),void 0,null),i},useId:function(){var e=Je(),t=le.identifierPrefix;if(q){var i=mt,n=gt;i=(n&~(1<<32-We(n)-1)).toString(32)+i,t=":"+t+"R"+i,i=Xn++,0<i&&(t+="H"+i.toString(32)),t+=":"}else i=tx++,t=":"+t+"r"+i.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},ox={readContext:De,useCallback:nu,useContext:De,useEffect:ys,useImperativeHandle:iu,useInsertionEffect:Jc,useLayoutEffect:eu,useMemo:ru,useReducer:Go,useRef:Zc,useState:function(){return Go(Zn)},useDebugValue:bs,useDeferredValue:function(e){var t=Fe();return au(t,re.memoizedState,e)},useTransition:function(){var e=Go(Zn)[0],t=Fe().memoizedState;return[e,t]},useMutableSource:Gc,useSyncExternalStore:Wc,useId:ou,unstable_isNewReconciler:!1},lx={readContext:De,useCallback:nu,useContext:De,useEffect:ys,useImperativeHandle:iu,useInsertionEffect:Jc,useLayoutEffect:eu,useMemo:ru,useReducer:Wo,useRef:Zc,useState:function(){return Wo(Zn)},useDebugValue:bs,useDeferredValue:function(e){var t=Fe();return re===null?t.memoizedState=e:au(t,re.memoizedState,e)},useTransition:function(){var e=Wo(Zn)[0],t=Fe().memoizedState;return[e,t]},useMutableSource:Gc,useSyncExternalStore:Wc,useId:ou,unstable_isNewReconciler:!1};function Ve(e,t){if(e&&e.defaultProps){t=X({},t),e=e.defaultProps;for(var i in e)t[i]===void 0&&(t[i]=e[i]);return t}return t}function Cl(e,t,i,n){t=e.memoizedState,i=i(n,t),i=i==null?t:X({},t,i),e.memoizedState=i,e.lanes===0&&(e.updateQueue.baseState=i)}var ja={isMounted:function(e){return(e=e._reactInternals)?hi(e)===e:!1},enqueueSetState:function(e,t,i){e=e._reactInternals;var n=ve(),r=Ft(e),a=ht(n,r);a.payload=t,i!=null&&(a.callback=i),t=Mt(e,a,r),t!==null&&(qe(t,e,r,n),Zr(t,e,r))},enqueueReplaceState:function(e,t,i){e=e._reactInternals;var n=ve(),r=Ft(e),a=ht(n,r);a.tag=1,a.payload=t,i!=null&&(a.callback=i),t=Mt(e,a,r),t!==null&&(qe(t,e,r,n),Zr(t,e,r))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var i=ve(),n=Ft(e),r=ht(i,n);r.tag=2,t!=null&&(r.callback=t),t=Mt(e,r,n),t!==null&&(qe(t,e,n,i),Zr(t,e,n))}};function wp(e,t,i,n,r,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(n,a,o):t.prototype&&t.prototype.isPureReactComponent?!Gn(i,n)||!Gn(r,a):!0}function pu(e,t,i){var n=!1,r=Ht,a=t.contextType;return typeof a=="object"&&a!==null?a=De(a):(r=Se(t)?pi:me.current,n=t.contextTypes,a=(n=n!=null)?Gi(e,r):Ht),t=new t(i,a),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=ja,e.stateNode=t,t._reactInternals=e,n&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=r,e.__reactInternalMemoizedMaskedChildContext=a),t}function kp(e,t,i,n){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(i,n),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(i,n),t.state!==e&&ja.enqueueReplaceState(t,t.state,null)}function Rl(e,t,i,n){var r=e.stateNode;r.props=i,r.state=e.memoizedState,r.refs={},us(e);var a=t.contextType;typeof a=="object"&&a!==null?r.context=De(a):(a=Se(t)?pi:me.current,r.context=Gi(e,a)),r.state=e.memoizedState,a=t.getDerivedStateFromProps,typeof a=="function"&&(Cl(e,t,a,i),r.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof r.getSnapshotBeforeUpdate=="function"||typeof r.UNSAFE_componentWillMount!="function"&&typeof r.componentWillMount!="function"||(t=r.state,typeof r.componentWillMount=="function"&&r.componentWillMount(),typeof r.UNSAFE_componentWillMount=="function"&&r.UNSAFE_componentWillMount(),t!==r.state&&ja.enqueueReplaceState(r,r.state,null),ba(e,i,r,n),r.state=e.memoizedState),typeof r.componentDidMount=="function"&&(e.flags|=4194308)}function $i(e,t){try{var i="",n=t;do i+=Mm(n),n=n.return;while(n);var r=i}catch(a){r=`
Error generating stack: `+a.message+`
`+a.stack}return{value:e,source:t,stack:r,digest:null}}function qo(e,t,i){return{value:e,source:null,stack:i??null,digest:t??null}}function Nl(e,t){try{console.error(t.value)}catch(i){setTimeout(function(){throw i})}}var sx=typeof WeakMap=="function"?WeakMap:Map;function cu(e,t,i){i=ht(-1,i),i.tag=3,i.payload={element:null};var n=t.value;return i.callback=function(){Ea||(Ea=!0,Fl=n),Nl(e,t)},i}function uu(e,t,i){i=ht(-1,i),i.tag=3;var n=e.type.getDerivedStateFromError;if(typeof n=="function"){var r=t.value;i.payload=function(){return n(r)},i.callback=function(){Nl(e,t)}}var a=e.stateNode;return a!==null&&typeof a.componentDidCatch=="function"&&(i.callback=function(){Nl(e,t),typeof n!="function"&&(Dt===null?Dt=new Set([this]):Dt.add(this));var o=t.stack;this.componentDidCatch(t.value,{componentStack:o!==null?o:""})}),i}function Sp(e,t,i){var n=e.pingCache;if(n===null){n=e.pingCache=new sx;var r=new Set;n.set(t,r)}else r=n.get(t),r===void 0&&(r=new Set,n.set(t,r));r.has(i)||(r.add(i),e=kx.bind(null,e,t,i),t.then(e,e))}function Ip(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function Ep(e,t,i,n,r){return(e.mode&1)===0?(e===t?e.flags|=65536:(e.flags|=128,i.flags|=131072,i.flags&=-52805,i.tag===1&&(i.alternate===null?i.tag=17:(t=ht(-1,1),t.tag=2,Mt(i,t,1))),i.lanes|=1),e):(e.flags|=65536,e.lanes=r,e)}var dx=wt.ReactCurrentOwner,we=!1;function xe(e,t,i,n){t.child=e===null?Bc(t,null,i,n):qi(t,e.child,i,n)}function _p(e,t,i,n,r){i=i.render;var a=t.ref;return Hi(t,r),n=xs(e,t,i,n,a,r),i=vs(),e!==null&&!we?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~r,bt(e,t,r)):(q&&i&&as(t),t.flags|=1,xe(e,t,n,r),t.child)}function Cp(e,t,i,n,r){if(e===null){var a=i.type;return typeof a=="function"&&!Rs(a)&&a.defaultProps===void 0&&i.compare===null&&i.defaultProps===void 0?(t.tag=15,t.type=a,fu(e,t,a,n,r)):(e=ra(i.type,null,n,t,t.mode,r),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,(e.lanes&r)===0){var o=a.memoizedProps;if(i=i.compare,i=i!==null?i:Gn,i(o,n)&&e.ref===t.ref)return bt(e,t,r)}return t.flags|=1,e=Ut(a,n),e.ref=t.ref,e.return=t,t.child=e}function fu(e,t,i,n,r){if(e!==null){var a=e.memoizedProps;if(Gn(a,n)&&e.ref===t.ref)if(we=!1,t.pendingProps=n=a,(e.lanes&r)!==0)(e.flags&131072)!==0&&(we=!0);else return t.lanes=e.lanes,bt(e,t,r)}return zl(e,t,i,n,r)}function gu(e,t,i){var n=t.pendingProps,r=n.children,a=e!==null?e.memoizedState:null;if(n.mode==="hidden")if((t.mode&1)===0)t.memoizedState={baseLanes:0,cachePool:null,transitions:null},V(Mi,Ee),Ee|=i;else{if((i&1073741824)===0)return e=a!==null?a.baseLanes|i:i,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,V(Mi,Ee),Ee|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},n=a!==null?a.baseLanes:i,V(Mi,Ee),Ee|=n}else a!==null?(n=a.baseLanes|i,t.memoizedState=null):n=i,V(Mi,Ee),Ee|=n;return xe(e,t,r,i),t.child}function mu(e,t){var i=t.ref;(e===null&&i!==null||e!==null&&e.ref!==i)&&(t.flags|=512,t.flags|=2097152)}function zl(e,t,i,n,r){var a=Se(i)?pi:me.current;return a=Gi(t,a),Hi(t,r),i=xs(e,t,i,n,a,r),n=vs(),e!==null&&!we?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~r,bt(e,t,r)):(q&&n&&as(t),t.flags|=1,xe(e,t,i,r),t.child)}function Rp(e,t,i,n,r){if(Se(i)){var a=!0;ma(t)}else a=!1;if(Hi(t,r),t.stateNode===null)ta(e,t),pu(t,i,n),Rl(t,i,n,r),n=!0;else if(e===null){var o=t.stateNode,l=t.memoizedProps;o.props=l;var s=o.context,d=i.contextType;typeof d=="object"&&d!==null?d=De(d):(d=Se(i)?pi:me.current,d=Gi(t,d));var u=i.getDerivedStateFromProps,h=typeof u=="function"||typeof o.getSnapshotBeforeUpdate=="function";h||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(l!==n||s!==d)&&kp(t,o,n,d),Rt=!1;var p=t.memoizedState;o.state=p,ba(t,n,o,r),s=t.memoizedState,l!==n||p!==s||ke.current||Rt?(typeof u=="function"&&(Cl(t,i,u,n),s=t.memoizedState),(l=Rt||wp(t,i,l,n,p,s,d))?(h||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(t.flags|=4194308)):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=n,t.memoizedState=s),o.props=n,o.state=s,o.context=d,n=l):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),n=!1)}else{o=t.stateNode,Vc(e,t),l=t.memoizedProps,d=t.type===t.elementType?l:Ve(t.type,l),o.props=d,h=t.pendingProps,p=o.context,s=i.contextType,typeof s=="object"&&s!==null?s=De(s):(s=Se(i)?pi:me.current,s=Gi(t,s));var x=i.getDerivedStateFromProps;(u=typeof x=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(l!==h||p!==s)&&kp(t,o,n,s),Rt=!1,p=t.memoizedState,o.state=p,ba(t,n,o,r);var v=t.memoizedState;l!==h||p!==v||ke.current||Rt?(typeof x=="function"&&(Cl(t,i,x,n),v=t.memoizedState),(d=Rt||wp(t,i,d,n,p,v,s)||!1)?(u||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(n,v,s),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(n,v,s)),typeof o.componentDidUpdate=="function"&&(t.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof o.componentDidUpdate!="function"||l===e.memoizedProps&&p===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||l===e.memoizedProps&&p===e.memoizedState||(t.flags|=1024),t.memoizedProps=n,t.memoizedState=v),o.props=n,o.state=v,o.context=s,n=d):(typeof o.componentDidUpdate!="function"||l===e.memoizedProps&&p===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||l===e.memoizedProps&&p===e.memoizedState||(t.flags|=1024),n=!1)}return Pl(e,t,i,n,a,r)}function Pl(e,t,i,n,r,a){mu(e,t);var o=(t.flags&128)!==0;if(!n&&!o)return r&&fp(t,i,!1),bt(e,t,a);n=t.stateNode,dx.current=t;var l=o&&typeof i.getDerivedStateFromError!="function"?null:n.render();return t.flags|=1,e!==null&&o?(t.child=qi(t,e.child,null,a),t.child=qi(t,null,l,a)):xe(e,t,l,a),t.memoizedState=n.state,r&&fp(t,i,!0),t.child}function hu(e){var t=e.stateNode;t.pendingContext?up(e,t.pendingContext,t.pendingContext!==t.context):t.context&&up(e,t.context,!1),fs(e,t.containerInfo)}function Np(e,t,i,n,r){return Wi(),ls(r),t.flags|=256,xe(e,t,i,n),t.child}var Ll={dehydrated:null,treeContext:null,retryLane:0};function Tl(e){return{baseLanes:e,cachePool:null,transitions:null}}function xu(e,t,i){var n=t.pendingProps,r=$.current,a=!1,o=(t.flags&128)!==0,l;if((l=o)||(l=e!==null&&e.memoizedState===null?!1:(r&2)!==0),l?(a=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(r|=1),V($,r&1),e===null)return El(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((t.mode&1)===0?t.lanes=1:e.data==="$!"?t.lanes=8:t.lanes=1073741824,null):(o=n.children,e=n.fallback,a?(n=t.mode,a=t.child,o={mode:"hidden",children:o},(n&1)===0&&a!==null?(a.childLanes=0,a.pendingProps=o):a=Fa(o,n,0,null),e=di(e,n,i,null),a.return=t,e.return=t,a.sibling=e,t.child=a,t.child.memoizedState=Tl(i),t.memoizedState=Ll,e):ws(t,o));if(r=e.memoizedState,r!==null&&(l=r.dehydrated,l!==null))return px(e,t,o,n,l,r,i);if(a){a=n.fallback,o=t.mode,r=e.child,l=r.sibling;var s={mode:"hidden",children:n.children};return(o&1)===0&&t.child!==r?(n=t.child,n.childLanes=0,n.pendingProps=s,t.deletions=null):(n=Ut(r,s),n.subtreeFlags=r.subtreeFlags&14680064),l!==null?a=Ut(l,a):(a=di(a,o,i,null),a.flags|=2),a.return=t,n.return=t,n.sibling=a,t.child=n,n=a,a=t.child,o=e.child.memoizedState,o=o===null?Tl(i):{baseLanes:o.baseLanes|i,cachePool:null,transitions:o.transitions},a.memoizedState=o,a.childLanes=e.childLanes&~i,t.memoizedState=Ll,n}return a=e.child,e=a.sibling,n=Ut(a,{mode:"visible",children:n.children}),(t.mode&1)===0&&(n.lanes=i),n.return=t,n.sibling=null,e!==null&&(i=t.deletions,i===null?(t.deletions=[e],t.flags|=16):i.push(e)),t.child=n,t.memoizedState=null,n}function ws(e,t){return t=Fa({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function Wr(e,t,i,n){return n!==null&&ls(n),qi(t,e.child,null,i),e=ws(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function px(e,t,i,n,r,a,o){if(i)return t.flags&256?(t.flags&=-257,n=qo(Error(w(422))),Wr(e,t,o,n)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(a=n.fallback,r=t.mode,n=Fa({mode:"visible",children:n.children},r,0,null),a=di(a,r,o,null),a.flags|=2,n.return=t,a.return=t,n.sibling=a,t.child=n,(t.mode&1)!==0&&qi(t,e.child,null,o),t.child.memoizedState=Tl(o),t.memoizedState=Ll,a);if((t.mode&1)===0)return Wr(e,t,o,null);if(r.data==="$!"){if(n=r.nextSibling&&r.nextSibling.dataset,n)var l=n.dgst;return n=l,a=Error(w(419)),n=qo(a,n,void 0),Wr(e,t,o,n)}if(l=(o&e.childLanes)!==0,we||l){if(n=le,n!==null){switch(o&-o){case 4:r=2;break;case 16:r=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:r=32;break;case 536870912:r=268435456;break;default:r=0}r=(r&(n.suspendedLanes|o))!==0?0:r,r!==0&&r!==a.retryLane&&(a.retryLane=r,yt(e,r),qe(n,e,r,-1))}return Cs(),n=qo(Error(w(421))),Wr(e,t,o,n)}return r.data==="$?"?(t.flags|=128,t.child=e.child,t=Sx.bind(null,e),r._reactRetry=t,null):(e=a.treeContext,_e=jt(r.nextSibling),Ce=t,q=!0,Ge=null,e!==null&&(Ae[Oe++]=gt,Ae[Oe++]=mt,Ae[Oe++]=ci,gt=e.id,mt=e.overflow,ci=t),t=ws(t,n.children),t.flags|=4096,t)}function zp(e,t,i){e.lanes|=t;var n=e.alternate;n!==null&&(n.lanes|=t),_l(e.return,t,i)}function Ko(e,t,i,n,r){var a=e.memoizedState;a===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:n,tail:i,tailMode:r}:(a.isBackwards=t,a.rendering=null,a.renderingStartTime=0,a.last=n,a.tail=i,a.tailMode=r)}function vu(e,t,i){var n=t.pendingProps,r=n.revealOrder,a=n.tail;if(xe(e,t,n.children,i),n=$.current,(n&2)!==0)n=n&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&zp(e,i,t);else if(e.tag===19)zp(e,i,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}n&=1}if(V($,n),(t.mode&1)===0)t.memoizedState=null;else switch(r){case"forwards":for(i=t.child,r=null;i!==null;)e=i.alternate,e!==null&&wa(e)===null&&(r=i),i=i.sibling;i=r,i===null?(r=t.child,t.child=null):(r=i.sibling,i.sibling=null),Ko(t,!1,r,i,a);break;case"backwards":for(i=null,r=t.child,t.child=null;r!==null;){if(e=r.alternate,e!==null&&wa(e)===null){t.child=r;break}e=r.sibling,r.sibling=i,i=r,r=e}Ko(t,!0,i,null,a);break;case"together":Ko(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function ta(e,t){(t.mode&1)===0&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function bt(e,t,i){if(e!==null&&(t.dependencies=e.dependencies),fi|=t.lanes,(i&t.childLanes)===0)return null;if(e!==null&&t.child!==e.child)throw Error(w(153));if(t.child!==null){for(e=t.child,i=Ut(e,e.pendingProps),t.child=i,i.return=t;e.sibling!==null;)e=e.sibling,i=i.sibling=Ut(e,e.pendingProps),i.return=t;i.sibling=null}return t.child}function cx(e,t,i){switch(t.tag){case 3:hu(t),Wi();break;case 5:Qc(t);break;case 1:Se(t.type)&&ma(t);break;case 4:fs(t,t.stateNode.containerInfo);break;case 10:var n=t.type._context,r=t.memoizedProps.value;V(va,n._currentValue),n._currentValue=r;break;case 13:if(n=t.memoizedState,n!==null)return n.dehydrated!==null?(V($,$.current&1),t.flags|=128,null):(i&t.child.childLanes)!==0?xu(e,t,i):(V($,$.current&1),e=bt(e,t,i),e!==null?e.sibling:null);V($,$.current&1);break;case 19:if(n=(i&t.childLanes)!==0,(e.flags&128)!==0){if(n)return vu(e,t,i);t.flags|=128}if(r=t.memoizedState,r!==null&&(r.rendering=null,r.tail=null,r.lastEffect=null),V($,$.current),n)break;return null;case 22:case 23:return t.lanes=0,gu(e,t,i)}return bt(e,t,i)}var yu,Al,bu,wu;yu=function(e,t){for(var i=t.child;i!==null;){if(i.tag===5||i.tag===6)e.appendChild(i.stateNode);else if(i.tag!==4&&i.child!==null){i.child.return=i,i=i.child;continue}if(i===t)break;for(;i.sibling===null;){if(i.return===null||i.return===t)return;i=i.return}i.sibling.return=i.return,i=i.sibling}};Al=function(){};bu=function(e,t,i,n){var r=e.memoizedProps;if(r!==n){e=t.stateNode,li(it.current);var a=null;switch(i){case"input":r=il(e,r),n=il(e,n),a=[];break;case"select":r=X({},r,{value:void 0}),n=X({},n,{value:void 0}),a=[];break;case"textarea":r=al(e,r),n=al(e,n),a=[];break;default:typeof r.onClick!="function"&&typeof n.onClick=="function"&&(e.onclick=fa)}ll(i,n);var o;i=null;for(d in r)if(!n.hasOwnProperty(d)&&r.hasOwnProperty(d)&&r[d]!=null)if(d==="style"){var l=r[d];for(o in l)l.hasOwnProperty(o)&&(i||(i={}),i[o]="")}else d!=="dangerouslySetInnerHTML"&&d!=="children"&&d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&d!=="autoFocus"&&(Dn.hasOwnProperty(d)?a||(a=[]):(a=a||[]).push(d,null));for(d in n){var s=n[d];if(l=r?.[d],n.hasOwnProperty(d)&&s!==l&&(s!=null||l!=null))if(d==="style")if(l){for(o in l)!l.hasOwnProperty(o)||s&&s.hasOwnProperty(o)||(i||(i={}),i[o]="");for(o in s)s.hasOwnProperty(o)&&l[o]!==s[o]&&(i||(i={}),i[o]=s[o])}else i||(a||(a=[]),a.push(d,i)),i=s;else d==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,l=l?l.__html:void 0,s!=null&&l!==s&&(a=a||[]).push(d,s)):d==="children"?typeof s!="string"&&typeof s!="number"||(a=a||[]).push(d,""+s):d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&(Dn.hasOwnProperty(d)?(s!=null&&d==="onScroll"&&Q("scroll",e),a||l===s||(a=[])):(a=a||[]).push(d,s))}i&&(a=a||[]).push("style",i);var d=a;(t.updateQueue=d)&&(t.flags|=4)}};wu=function(e,t,i,n){i!==n&&(t.flags|=4)};function kn(e,t){if(!q)switch(e.tailMode){case"hidden":t=e.tail;for(var i=null;t!==null;)t.alternate!==null&&(i=t),t=t.sibling;i===null?e.tail=null:i.sibling=null;break;case"collapsed":i=e.tail;for(var n=null;i!==null;)i.alternate!==null&&(n=i),i=i.sibling;n===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:n.sibling=null}}function fe(e){var t=e.alternate!==null&&e.alternate.child===e.child,i=0,n=0;if(t)for(var r=e.child;r!==null;)i|=r.lanes|r.childLanes,n|=r.subtreeFlags&14680064,n|=r.flags&14680064,r.return=e,r=r.sibling;else for(r=e.child;r!==null;)i|=r.lanes|r.childLanes,n|=r.subtreeFlags,n|=r.flags,r.return=e,r=r.sibling;return e.subtreeFlags|=n,e.childLanes=i,t}function ux(e,t,i){var n=t.pendingProps;switch(os(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return fe(t),null;case 1:return Se(t.type)&&ga(),fe(t),null;case 3:return n=t.stateNode,Ki(),G(ke),G(me),ms(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(Qr(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Ge!==null&&(Hl(Ge),Ge=null))),Al(e,t),fe(t),null;case 5:gs(t);var r=li(Yn.current);if(i=t.type,e!==null&&t.stateNode!=null)bu(e,t,i,n,r),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!n){if(t.stateNode===null)throw Error(w(166));return fe(t),null}if(e=li(it.current),Qr(t)){n=t.stateNode,i=t.type;var a=t.memoizedProps;switch(n[et]=t,n[Kn]=a,e=(t.mode&1)!==0,i){case"dialog":Q("cancel",n),Q("close",n);break;case"iframe":case"object":case"embed":Q("load",n);break;case"video":case"audio":for(r=0;r<Rn.length;r++)Q(Rn[r],n);break;case"source":Q("error",n);break;case"img":case"image":case"link":Q("error",n),Q("load",n);break;case"details":Q("toggle",n);break;case"input":Dd(n,a),Q("invalid",n);break;case"select":n._wrapperState={wasMultiple:!!a.multiple},Q("invalid",n);break;case"textarea":Ud(n,a),Q("invalid",n)}ll(i,a),r=null;for(var o in a)if(a.hasOwnProperty(o)){var l=a[o];o==="children"?typeof l=="string"?n.textContent!==l&&(a.suppressHydrationWarning!==!0&&Vr(n.textContent,l,e),r=["children",l]):typeof l=="number"&&n.textContent!==""+l&&(a.suppressHydrationWarning!==!0&&Vr(n.textContent,l,e),r=["children",""+l]):Dn.hasOwnProperty(o)&&l!=null&&o==="onScroll"&&Q("scroll",n)}switch(i){case"input":Pr(n),Fd(n,a,!0);break;case"textarea":Pr(n),Bd(n);break;case"select":case"option":break;default:typeof a.onClick=="function"&&(n.onclick=fa)}n=r,t.updateQueue=n,n!==null&&(t.flags|=4)}else{o=r.nodeType===9?r:r.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=$p(i)),e==="http://www.w3.org/1999/xhtml"?i==="script"?(e=o.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof n.is=="string"?e=o.createElement(i,{is:n.is}):(e=o.createElement(i),i==="select"&&(o=e,n.multiple?o.multiple=!0:n.size&&(o.size=n.size))):e=o.createElementNS(e,i),e[et]=t,e[Kn]=n,yu(e,t,!1,!1),t.stateNode=e;e:{switch(o=sl(i,n),i){case"dialog":Q("cancel",e),Q("close",e),r=n;break;case"iframe":case"object":case"embed":Q("load",e),r=n;break;case"video":case"audio":for(r=0;r<Rn.length;r++)Q(Rn[r],e);r=n;break;case"source":Q("error",e),r=n;break;case"img":case"image":case"link":Q("error",e),Q("load",e),r=n;break;case"details":Q("toggle",e),r=n;break;case"input":Dd(e,n),r=il(e,n),Q("invalid",e);break;case"option":r=n;break;case"select":e._wrapperState={wasMultiple:!!n.multiple},r=X({},n,{value:void 0}),Q("invalid",e);break;case"textarea":Ud(e,n),r=al(e,n),Q("invalid",e);break;default:r=n}ll(i,r),l=r;for(a in l)if(l.hasOwnProperty(a)){var s=l[a];a==="style"?Zp(e,s):a==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,s!=null&&Yp(e,s)):a==="children"?typeof s=="string"?(i!=="textarea"||s!=="")&&Fn(e,s):typeof s=="number"&&Fn(e,""+s):a!=="suppressContentEditableWarning"&&a!=="suppressHydrationWarning"&&a!=="autoFocus"&&(Dn.hasOwnProperty(a)?s!=null&&a==="onScroll"&&Q("scroll",e):s!=null&&Gl(e,a,s,o))}switch(i){case"input":Pr(e),Fd(e,n,!1);break;case"textarea":Pr(e),Bd(e);break;case"option":n.value!=null&&e.setAttribute("value",""+Bt(n.value));break;case"select":e.multiple=!!n.multiple,a=n.value,a!=null?Di(e,!!n.multiple,a,!1):n.defaultValue!=null&&Di(e,!!n.multiple,n.defaultValue,!0);break;default:typeof r.onClick=="function"&&(e.onclick=fa)}switch(i){case"button":case"input":case"select":case"textarea":n=!!n.autoFocus;break e;case"img":n=!0;break e;default:n=!1}}n&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return fe(t),null;case 6:if(e&&t.stateNode!=null)wu(e,t,e.memoizedProps,n);else{if(typeof n!="string"&&t.stateNode===null)throw Error(w(166));if(i=li(Yn.current),li(it.current),Qr(t)){if(n=t.stateNode,i=t.memoizedProps,n[et]=t,(a=n.nodeValue!==i)&&(e=Ce,e!==null))switch(e.tag){case 3:Vr(n.nodeValue,i,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Vr(n.nodeValue,i,(e.mode&1)!==0)}a&&(t.flags|=4)}else n=(i.nodeType===9?i:i.ownerDocument).createTextNode(n),n[et]=t,t.stateNode=n}return fe(t),null;case 13:if(G($),n=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(q&&_e!==null&&(t.mode&1)!==0&&(t.flags&128)===0)Fc(),Wi(),t.flags|=98560,a=!1;else if(a=Qr(t),n!==null&&n.dehydrated!==null){if(e===null){if(!a)throw Error(w(318));if(a=t.memoizedState,a=a!==null?a.dehydrated:null,!a)throw Error(w(317));a[et]=t}else Wi(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;fe(t),a=!1}else Ge!==null&&(Hl(Ge),Ge=null),a=!0;if(!a)return t.flags&65536?t:null}return(t.flags&128)!==0?(t.lanes=i,t):(n=n!==null,n!==(e!==null&&e.memoizedState!==null)&&n&&(t.child.flags|=8192,(t.mode&1)!==0&&(e===null||($.current&1)!==0?ae===0&&(ae=3):Cs())),t.updateQueue!==null&&(t.flags|=4),fe(t),null);case 4:return Ki(),Al(e,t),e===null&&Wn(t.stateNode.containerInfo),fe(t),null;case 10:return ps(t.type._context),fe(t),null;case 17:return Se(t.type)&&ga(),fe(t),null;case 19:if(G($),a=t.memoizedState,a===null)return fe(t),null;if(n=(t.flags&128)!==0,o=a.rendering,o===null)if(n)kn(a,!1);else{if(ae!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(o=wa(e),o!==null){for(t.flags|=128,kn(a,!1),n=o.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),t.subtreeFlags=0,n=i,i=t.child;i!==null;)a=i,e=n,a.flags&=14680066,o=a.alternate,o===null?(a.childLanes=0,a.lanes=e,a.child=null,a.subtreeFlags=0,a.memoizedProps=null,a.memoizedState=null,a.updateQueue=null,a.dependencies=null,a.stateNode=null):(a.childLanes=o.childLanes,a.lanes=o.lanes,a.child=o.child,a.subtreeFlags=0,a.deletions=null,a.memoizedProps=o.memoizedProps,a.memoizedState=o.memoizedState,a.updateQueue=o.updateQueue,a.type=o.type,e=o.dependencies,a.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),i=i.sibling;return V($,$.current&1|2),t.child}e=e.sibling}a.tail!==null&&ee()>Yi&&(t.flags|=128,n=!0,kn(a,!1),t.lanes=4194304)}else{if(!n)if(e=wa(o),e!==null){if(t.flags|=128,n=!0,i=e.updateQueue,i!==null&&(t.updateQueue=i,t.flags|=4),kn(a,!0),a.tail===null&&a.tailMode==="hidden"&&!o.alternate&&!q)return fe(t),null}else 2*ee()-a.renderingStartTime>Yi&&i!==1073741824&&(t.flags|=128,n=!0,kn(a,!1),t.lanes=4194304);a.isBackwards?(o.sibling=t.child,t.child=o):(i=a.last,i!==null?i.sibling=o:t.child=o,a.last=o)}return a.tail!==null?(t=a.tail,a.rendering=t,a.tail=t.sibling,a.renderingStartTime=ee(),t.sibling=null,i=$.current,V($,n?i&1|2:i&1),t):(fe(t),null);case 22:case 23:return _s(),n=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==n&&(t.flags|=8192),n&&(t.mode&1)!==0?(Ee&1073741824)!==0&&(fe(t),t.subtreeFlags&6&&(t.flags|=8192)):fe(t),null;case 24:return null;case 25:return null}throw Error(w(156,t.tag))}function fx(e,t){switch(os(t),t.tag){case 1:return Se(t.type)&&ga(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Ki(),G(ke),G(me),ms(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 5:return gs(t),null;case 13:if(G($),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(w(340));Wi()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return G($),null;case 4:return Ki(),null;case 10:return ps(t.type._context),null;case 22:case 23:return _s(),null;case 24:return null;default:return null}}var qr=!1,ge=!1,gx=typeof WeakSet=="function"?WeakSet:Set,_=null;function ji(e,t){var i=e.ref;if(i!==null)if(typeof i=="function")try{i(null)}catch(n){Z(e,t,n)}else i.current=null}function Ol(e,t,i){try{i()}catch(n){Z(e,t,n)}}var Pp=!1;function mx(e,t){if(vl=pa,e=_c(),rs(e)){if("selectionStart"in e)var i={start:e.selectionStart,end:e.selectionEnd};else e:{i=(i=e.ownerDocument)&&i.defaultView||window;var n=i.getSelection&&i.getSelection();if(n&&n.rangeCount!==0){i=n.anchorNode;var r=n.anchorOffset,a=n.focusNode;n=n.focusOffset;try{i.nodeType,a.nodeType}catch{i=null;break e}var o=0,l=-1,s=-1,d=0,u=0,h=e,p=null;t:for(;;){for(var x;h!==i||r!==0&&h.nodeType!==3||(l=o+r),h!==a||n!==0&&h.nodeType!==3||(s=o+n),h.nodeType===3&&(o+=h.nodeValue.length),(x=h.firstChild)!==null;)p=h,h=x;for(;;){if(h===e)break t;if(p===i&&++d===r&&(l=o),p===a&&++u===n&&(s=o),(x=h.nextSibling)!==null)break;h=p,p=h.parentNode}h=x}i=l===-1||s===-1?null:{start:l,end:s}}else i=null}i=i||{start:0,end:0}}else i=null;for(yl={focusedElem:e,selectionRange:i},pa=!1,_=t;_!==null;)if(t=_,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,_=e;else for(;_!==null;){t=_;try{var v=t.alternate;if((t.flags&1024)!==0)switch(t.tag){case 0:case 11:case 15:break;case 1:if(v!==null){var g=v.memoizedProps,k=v.memoizedState,f=t.stateNode,c=f.getSnapshotBeforeUpdate(t.elementType===t.type?g:Ve(t.type,g),k);f.__reactInternalSnapshotBeforeUpdate=c}break;case 3:var m=t.stateNode.containerInfo;m.nodeType===1?m.textContent="":m.nodeType===9&&m.documentElement&&m.removeChild(m.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(w(163))}}catch(y){Z(t,t.return,y)}if(e=t.sibling,e!==null){e.return=t.return,_=e;break}_=t.return}return v=Pp,Pp=!1,v}function On(e,t,i){var n=t.updateQueue;if(n=n!==null?n.lastEffect:null,n!==null){var r=n=n.next;do{if((r.tag&e)===e){var a=r.destroy;r.destroy=void 0,a!==void 0&&Ol(t,i,a)}r=r.next}while(r!==n)}}function Ma(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var i=t=t.next;do{if((i.tag&e)===e){var n=i.create;i.destroy=n()}i=i.next}while(i!==t)}}function jl(e){var t=e.ref;if(t!==null){var i=e.stateNode;e.tag,e=i,typeof t=="function"?t(e):t.current=e}}function ku(e){var t=e.alternate;t!==null&&(e.alternate=null,ku(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[et],delete t[Kn],delete t[kl],delete t[Xh],delete t[Zh])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function Su(e){return e.tag===5||e.tag===3||e.tag===4}function Lp(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Su(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Ml(e,t,i){var n=e.tag;if(n===5||n===6)e=e.stateNode,t?i.nodeType===8?i.parentNode.insertBefore(e,t):i.insertBefore(e,t):(i.nodeType===8?(t=i.parentNode,t.insertBefore(e,i)):(t=i,t.appendChild(e)),i=i._reactRootContainer,i!=null||t.onclick!==null||(t.onclick=fa));else if(n!==4&&(e=e.child,e!==null))for(Ml(e,t,i),e=e.sibling;e!==null;)Ml(e,t,i),e=e.sibling}function Dl(e,t,i){var n=e.tag;if(n===5||n===6)e=e.stateNode,t?i.insertBefore(e,t):i.appendChild(e);else if(n!==4&&(e=e.child,e!==null))for(Dl(e,t,i),e=e.sibling;e!==null;)Dl(e,t,i),e=e.sibling}var se=null,Qe=!1;function _t(e,t,i){for(i=i.child;i!==null;)Iu(e,t,i),i=i.sibling}function Iu(e,t,i){if(tt&&typeof tt.onCommitFiberUnmount=="function")try{tt.onCommitFiberUnmount(Na,i)}catch{}switch(i.tag){case 5:ge||ji(i,t);case 6:var n=se,r=Qe;se=null,_t(e,t,i),se=n,Qe=r,se!==null&&(Qe?(e=se,i=i.stateNode,e.nodeType===8?e.parentNode.removeChild(i):e.removeChild(i)):se.removeChild(i.stateNode));break;case 18:se!==null&&(Qe?(e=se,i=i.stateNode,e.nodeType===8?Bo(e.parentNode,i):e.nodeType===1&&Bo(e,i),Vn(e)):Bo(se,i.stateNode));break;case 4:n=se,r=Qe,se=i.stateNode.containerInfo,Qe=!0,_t(e,t,i),se=n,Qe=r;break;case 0:case 11:case 14:case 15:if(!ge&&(n=i.updateQueue,n!==null&&(n=n.lastEffect,n!==null))){r=n=n.next;do{var a=r,o=a.destroy;a=a.tag,o!==void 0&&((a&2)!==0||(a&4)!==0)&&Ol(i,t,o),r=r.next}while(r!==n)}_t(e,t,i);break;case 1:if(!ge&&(ji(i,t),n=i.stateNode,typeof n.componentWillUnmount=="function"))try{n.props=i.memoizedProps,n.state=i.memoizedState,n.componentWillUnmount()}catch(l){Z(i,t,l)}_t(e,t,i);break;case 21:_t(e,t,i);break;case 22:i.mode&1?(ge=(n=ge)||i.memoizedState!==null,_t(e,t,i),ge=n):_t(e,t,i);break;default:_t(e,t,i)}}function Tp(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var i=e.stateNode;i===null&&(i=e.stateNode=new gx),t.forEach(function(n){var r=Ix.bind(null,e,n);i.has(n)||(i.add(n),n.then(r,r))})}}function He(e,t){var i=t.deletions;if(i!==null)for(var n=0;n<i.length;n++){var r=i[n];try{var a=e,o=t,l=o;e:for(;l!==null;){switch(l.tag){case 5:se=l.stateNode,Qe=!1;break e;case 3:se=l.stateNode.containerInfo,Qe=!0;break e;case 4:se=l.stateNode.containerInfo,Qe=!0;break e}l=l.return}if(se===null)throw Error(w(160));Iu(a,o,r),se=null,Qe=!1;var s=r.alternate;s!==null&&(s.return=null),r.return=null}catch(d){Z(r,t,d)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)Eu(t,e),t=t.sibling}function Eu(e,t){var i=e.alternate,n=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(He(t,e),Ze(e),n&4){try{On(3,e,e.return),Ma(3,e)}catch(g){Z(e,e.return,g)}try{On(5,e,e.return)}catch(g){Z(e,e.return,g)}}break;case 1:He(t,e),Ze(e),n&512&&i!==null&&ji(i,i.return);break;case 5:if(He(t,e),Ze(e),n&512&&i!==null&&ji(i,i.return),e.flags&32){var r=e.stateNode;try{Fn(r,"")}catch(g){Z(e,e.return,g)}}if(n&4&&(r=e.stateNode,r!=null)){var a=e.memoizedProps,o=i!==null?i.memoizedProps:a,l=e.type,s=e.updateQueue;if(e.updateQueue=null,s!==null)try{l==="input"&&a.type==="radio"&&a.name!=null&&qp(r,a),sl(l,o);var d=sl(l,a);for(o=0;o<s.length;o+=2){var u=s[o],h=s[o+1];u==="style"?Zp(r,h):u==="dangerouslySetInnerHTML"?Yp(r,h):u==="children"?Fn(r,h):Gl(r,u,h,d)}switch(l){case"input":nl(r,a);break;case"textarea":Kp(r,a);break;case"select":var p=r._wrapperState.wasMultiple;r._wrapperState.wasMultiple=!!a.multiple;var x=a.value;x!=null?Di(r,!!a.multiple,x,!1):p!==!!a.multiple&&(a.defaultValue!=null?Di(r,!!a.multiple,a.defaultValue,!0):Di(r,!!a.multiple,a.multiple?[]:"",!1))}r[Kn]=a}catch(g){Z(e,e.return,g)}}break;case 6:if(He(t,e),Ze(e),n&4){if(e.stateNode===null)throw Error(w(162));r=e.stateNode,a=e.memoizedProps;try{r.nodeValue=a}catch(g){Z(e,e.return,g)}}break;case 3:if(He(t,e),Ze(e),n&4&&i!==null&&i.memoizedState.isDehydrated)try{Vn(t.containerInfo)}catch(g){Z(e,e.return,g)}break;case 4:He(t,e),Ze(e);break;case 13:He(t,e),Ze(e),r=e.child,r.flags&8192&&(a=r.memoizedState!==null,r.stateNode.isHidden=a,!a||r.alternate!==null&&r.alternate.memoizedState!==null||(Is=ee())),n&4&&Tp(e);break;case 22:if(u=i!==null&&i.memoizedState!==null,e.mode&1?(ge=(d=ge)||u,He(t,e),ge=d):He(t,e),Ze(e),n&8192){if(d=e.memoizedState!==null,(e.stateNode.isHidden=d)&&!u&&(e.mode&1)!==0)for(_=e,u=e.child;u!==null;){for(h=_=u;_!==null;){switch(p=_,x=p.child,p.tag){case 0:case 11:case 14:case 15:On(4,p,p.return);break;case 1:ji(p,p.return);var v=p.stateNode;if(typeof v.componentWillUnmount=="function"){n=p,i=p.return;try{t=n,v.props=t.memoizedProps,v.state=t.memoizedState,v.componentWillUnmount()}catch(g){Z(n,i,g)}}break;case 5:ji(p,p.return);break;case 22:if(p.memoizedState!==null){Op(h);continue}}x!==null?(x.return=p,_=x):Op(h)}u=u.sibling}e:for(u=null,h=e;;){if(h.tag===5){if(u===null){u=h;try{r=h.stateNode,d?(a=r.style,typeof a.setProperty=="function"?a.setProperty("display","none","important"):a.display="none"):(l=h.stateNode,s=h.memoizedProps.style,o=s!=null&&s.hasOwnProperty("display")?s.display:null,l.style.display=Xp("display",o))}catch(g){Z(e,e.return,g)}}}else if(h.tag===6){if(u===null)try{h.stateNode.nodeValue=d?"":h.memoizedProps}catch(g){Z(e,e.return,g)}}else if((h.tag!==22&&h.tag!==23||h.memoizedState===null||h===e)&&h.child!==null){h.child.return=h,h=h.child;continue}if(h===e)break e;for(;h.sibling===null;){if(h.return===null||h.return===e)break e;u===h&&(u=null),h=h.return}u===h&&(u=null),h.sibling.return=h.return,h=h.sibling}}break;case 19:He(t,e),Ze(e),n&4&&Tp(e);break;case 21:break;default:He(t,e),Ze(e)}}function Ze(e){var t=e.flags;if(t&2){try{e:{for(var i=e.return;i!==null;){if(Su(i)){var n=i;break e}i=i.return}throw Error(w(160))}switch(n.tag){case 5:var r=n.stateNode;n.flags&32&&(Fn(r,""),n.flags&=-33);var a=Lp(e);Dl(e,a,r);break;case 3:case 4:var o=n.stateNode.containerInfo,l=Lp(e);Ml(e,l,o);break;default:throw Error(w(161))}}catch(s){Z(e,e.return,s)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function hx(e,t,i){_=e,_u(e,t,i)}function _u(e,t,i){for(var n=(e.mode&1)!==0;_!==null;){var r=_,a=r.child;if(r.tag===22&&n){var o=r.memoizedState!==null||qr;if(!o){var l=r.alternate,s=l!==null&&l.memoizedState!==null||ge;l=qr;var d=ge;if(qr=o,(ge=s)&&!d)for(_=r;_!==null;)o=_,s=o.child,o.tag===22&&o.memoizedState!==null?jp(r):s!==null?(s.return=o,_=s):jp(r);for(;a!==null;)_=a,_u(a,t,i),a=a.sibling;_=r,qr=l,ge=d}Ap(e,t,i)}else(r.subtreeFlags&8772)!==0&&a!==null?(a.return=r,_=a):Ap(e,t,i)}}function Ap(e){for(;_!==null;){var t=_;if((t.flags&8772)!==0){var i=t.alternate;try{if((t.flags&8772)!==0)switch(t.tag){case 0:case 11:case 15:ge||Ma(5,t);break;case 1:var n=t.stateNode;if(t.flags&4&&!ge)if(i===null)n.componentDidMount();else{var r=t.elementType===t.type?i.memoizedProps:Ve(t.type,i.memoizedProps);n.componentDidUpdate(r,i.memoizedState,n.__reactInternalSnapshotBeforeUpdate)}var a=t.updateQueue;a!==null&&vp(t,a,n);break;case 3:var o=t.updateQueue;if(o!==null){if(i=null,t.child!==null)switch(t.child.tag){case 5:i=t.child.stateNode;break;case 1:i=t.child.stateNode}vp(t,o,i)}break;case 5:var l=t.stateNode;if(i===null&&t.flags&4){i=l;var s=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":s.autoFocus&&i.focus();break;case"img":s.src&&(i.src=s.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var d=t.alternate;if(d!==null){var u=d.memoizedState;if(u!==null){var h=u.dehydrated;h!==null&&Vn(h)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(w(163))}ge||t.flags&512&&jl(t)}catch(p){Z(t,t.return,p)}}if(t===e){_=null;break}if(i=t.sibling,i!==null){i.return=t.return,_=i;break}_=t.return}}function Op(e){for(;_!==null;){var t=_;if(t===e){_=null;break}var i=t.sibling;if(i!==null){i.return=t.return,_=i;break}_=t.return}}function jp(e){for(;_!==null;){var t=_;try{switch(t.tag){case 0:case 11:case 15:var i=t.return;try{Ma(4,t)}catch(s){Z(t,i,s)}break;case 1:var n=t.stateNode;if(typeof n.componentDidMount=="function"){var r=t.return;try{n.componentDidMount()}catch(s){Z(t,r,s)}}var a=t.return;try{jl(t)}catch(s){Z(t,a,s)}break;case 5:var o=t.return;try{jl(t)}catch(s){Z(t,o,s)}}}catch(s){Z(t,t.return,s)}if(t===e){_=null;break}var l=t.sibling;if(l!==null){l.return=t.return,_=l;break}_=t.return}}var xx=Math.ceil,Ia=wt.ReactCurrentDispatcher,ks=wt.ReactCurrentOwner,Me=wt.ReactCurrentBatchConfig,j=0,le=null,ne=null,de=0,Ee=0,Mi=Qt(0),ae=0,er=null,fi=0,Da=0,Ss=0,jn=null,be=null,Is=0,Yi=1/0,ut=null,Ea=!1,Fl=null,Dt=null,Kr=!1,Lt=null,_a=0,Mn=0,Ul=null,ia=-1,na=0;function ve(){return(j&6)!==0?ee():ia!==-1?ia:ia=ee()}function Ft(e){return(e.mode&1)===0?1:(j&2)!==0&&de!==0?de&-de:ex.transition!==null?(na===0&&(na=pc()),na):(e=F,e!==0||(e=window.event,e=e===void 0?16:xc(e.type)),e)}function qe(e,t,i,n){if(50<Mn)throw Mn=0,Ul=null,Error(w(185));tr(e,i,n),((j&2)===0||e!==le)&&(e===le&&((j&2)===0&&(Da|=i),ae===4&&zt(e,de)),Ie(e,n),i===1&&j===0&&(t.mode&1)===0&&(Yi=ee()+500,Aa&&Gt()))}function Ie(e,t){var i=e.callbackNode;ih(e,t);var n=da(e,e===le?de:0);if(n===0)i!==null&&Qd(i),e.callbackNode=null,e.callbackPriority=0;else if(t=n&-n,e.callbackPriority!==t){if(i!=null&&Qd(i),t===1)e.tag===0?Jh(Mp.bind(null,e)):jc(Mp.bind(null,e)),$h(function(){(j&6)===0&&Gt()}),i=null;else{switch(cc(n)){case 1:i=Yl;break;case 4:i=sc;break;case 16:i=sa;break;case 536870912:i=dc;break;default:i=sa}i=Au(i,Cu.bind(null,e))}e.callbackPriority=t,e.callbackNode=i}}function Cu(e,t){if(ia=-1,na=0,(j&6)!==0)throw Error(w(327));var i=e.callbackNode;if(Vi()&&e.callbackNode!==i)return null;var n=da(e,e===le?de:0);if(n===0)return null;if((n&30)!==0||(n&e.expiredLanes)!==0||t)t=Ca(e,n);else{t=n;var r=j;j|=2;var a=Nu();(le!==e||de!==t)&&(ut=null,Yi=ee()+500,si(e,t));do try{bx();break}catch(l){Ru(e,l)}while(!0);ds(),Ia.current=a,j=r,ne!==null?t=0:(le=null,de=0,t=ae)}if(t!==0){if(t===2&&(r=fl(e),r!==0&&(n=r,t=Bl(e,r))),t===1)throw i=er,si(e,0),zt(e,n),Ie(e,ee()),i;if(t===6)zt(e,n);else{if(r=e.current.alternate,(n&30)===0&&!vx(r)&&(t=Ca(e,n),t===2&&(a=fl(e),a!==0&&(n=a,t=Bl(e,a))),t===1))throw i=er,si(e,0),zt(e,n),Ie(e,ee()),i;switch(e.finishedWork=r,e.finishedLanes=n,t){case 0:case 1:throw Error(w(345));case 2:ri(e,be,ut);break;case 3:if(zt(e,n),(n&130023424)===n&&(t=Is+500-ee(),10<t)){if(da(e,0)!==0)break;if(r=e.suspendedLanes,(r&n)!==n){ve(),e.pingedLanes|=e.suspendedLanes&r;break}e.timeoutHandle=wl(ri.bind(null,e,be,ut),t);break}ri(e,be,ut);break;case 4:if(zt(e,n),(n&4194240)===n)break;for(t=e.eventTimes,r=-1;0<n;){var o=31-We(n);a=1<<o,o=t[o],o>r&&(r=o),n&=~a}if(n=r,n=ee()-n,n=(120>n?120:480>n?480:1080>n?1080:1920>n?1920:3e3>n?3e3:4320>n?4320:1960*xx(n/1960))-n,10<n){e.timeoutHandle=wl(ri.bind(null,e,be,ut),n);break}ri(e,be,ut);break;case 5:ri(e,be,ut);break;default:throw Error(w(329))}}}return Ie(e,ee()),e.callbackNode===i?Cu.bind(null,e):null}function Bl(e,t){var i=jn;return e.current.memoizedState.isDehydrated&&(si(e,t).flags|=256),e=Ca(e,t),e!==2&&(t=be,be=i,t!==null&&Hl(t)),e}function Hl(e){be===null?be=e:be.push.apply(be,e)}function vx(e){for(var t=e;;){if(t.flags&16384){var i=t.updateQueue;if(i!==null&&(i=i.stores,i!==null))for(var n=0;n<i.length;n++){var r=i[n],a=r.getSnapshot;r=r.value;try{if(!Ke(a(),r))return!1}catch{return!1}}}if(i=t.child,t.subtreeFlags&16384&&i!==null)i.return=t,t=i;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function zt(e,t){for(t&=~Ss,t&=~Da,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var i=31-We(t),n=1<<i;e[i]=-1,t&=~n}}function Mp(e){if((j&6)!==0)throw Error(w(327));Vi();var t=da(e,0);if((t&1)===0)return Ie(e,ee()),null;var i=Ca(e,t);if(e.tag!==0&&i===2){var n=fl(e);n!==0&&(t=n,i=Bl(e,n))}if(i===1)throw i=er,si(e,0),zt(e,t),Ie(e,ee()),i;if(i===6)throw Error(w(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,ri(e,be,ut),Ie(e,ee()),null}function Es(e,t){var i=j;j|=1;try{return e(t)}finally{j=i,j===0&&(Yi=ee()+500,Aa&&Gt())}}function gi(e){Lt!==null&&Lt.tag===0&&(j&6)===0&&Vi();var t=j;j|=1;var i=Me.transition,n=F;try{if(Me.transition=null,F=1,e)return e()}finally{F=n,Me.transition=i,j=t,(j&6)===0&&Gt()}}function _s(){Ee=Mi.current,G(Mi)}function si(e,t){e.finishedWork=null,e.finishedLanes=0;var i=e.timeoutHandle;if(i!==-1&&(e.timeoutHandle=-1,Kh(i)),ne!==null)for(i=ne.return;i!==null;){var n=i;switch(os(n),n.tag){case 1:n=n.type.childContextTypes,n!=null&&ga();break;case 3:Ki(),G(ke),G(me),ms();break;case 5:gs(n);break;case 4:Ki();break;case 13:G($);break;case 19:G($);break;case 10:ps(n.type._context);break;case 22:case 23:_s()}i=i.return}if(le=e,ne=e=Ut(e.current,null),de=Ee=t,ae=0,er=null,Ss=Da=fi=0,be=jn=null,oi!==null){for(t=0;t<oi.length;t++)if(i=oi[t],n=i.interleaved,n!==null){i.interleaved=null;var r=n.next,a=i.pending;if(a!==null){var o=a.next;a.next=r,n.next=o}i.pending=n}oi=null}return e}function Ru(e,t){do{var i=ne;try{if(ds(),Jr.current=Sa,ka){for(var n=Y.memoizedState;n!==null;){var r=n.queue;r!==null&&(r.pending=null),n=n.next}ka=!1}if(ui=0,oe=re=Y=null,An=!1,Xn=0,ks.current=null,i===null||i.return===null){ae=1,er=t,ne=null;break}e:{var a=e,o=i.return,l=i,s=t;if(t=de,l.flags|=32768,s!==null&&typeof s=="object"&&typeof s.then=="function"){var d=s,u=l,h=u.tag;if((u.mode&1)===0&&(h===0||h===11||h===15)){var p=u.alternate;p?(u.updateQueue=p.updateQueue,u.memoizedState=p.memoizedState,u.lanes=p.lanes):(u.updateQueue=null,u.memoizedState=null)}var x=Ip(o);if(x!==null){x.flags&=-257,Ep(x,o,l,a,t),x.mode&1&&Sp(a,d,t),t=x,s=d;var v=t.updateQueue;if(v===null){var g=new Set;g.add(s),t.updateQueue=g}else v.add(s);break e}else{if((t&1)===0){Sp(a,d,t),Cs();break e}s=Error(w(426))}}else if(q&&l.mode&1){var k=Ip(o);if(k!==null){(k.flags&65536)===0&&(k.flags|=256),Ep(k,o,l,a,t),ls($i(s,l));break e}}a=s=$i(s,l),ae!==4&&(ae=2),jn===null?jn=[a]:jn.push(a),a=o;do{switch(a.tag){case 3:a.flags|=65536,t&=-t,a.lanes|=t;var f=cu(a,s,t);xp(a,f);break e;case 1:l=s;var c=a.type,m=a.stateNode;if((a.flags&128)===0&&(typeof c.getDerivedStateFromError=="function"||m!==null&&typeof m.componentDidCatch=="function"&&(Dt===null||!Dt.has(m)))){a.flags|=65536,t&=-t,a.lanes|=t;var y=uu(a,l,t);xp(a,y);break e}}a=a.return}while(a!==null)}Pu(i)}catch(S){t=S,ne===i&&i!==null&&(ne=i=i.return);continue}break}while(!0)}function Nu(){var e=Ia.current;return Ia.current=Sa,e===null?Sa:e}function Cs(){(ae===0||ae===3||ae===2)&&(ae=4),le===null||(fi&268435455)===0&&(Da&268435455)===0||zt(le,de)}function Ca(e,t){var i=j;j|=2;var n=Nu();(le!==e||de!==t)&&(ut=null,si(e,t));do try{yx();break}catch(r){Ru(e,r)}while(!0);if(ds(),j=i,Ia.current=n,ne!==null)throw Error(w(261));return le=null,de=0,ae}function yx(){for(;ne!==null;)zu(ne)}function bx(){for(;ne!==null&&!qm();)zu(ne)}function zu(e){var t=Tu(e.alternate,e,Ee);e.memoizedProps=e.pendingProps,t===null?Pu(e):ne=t,ks.current=null}function Pu(e){var t=e;do{var i=t.alternate;if(e=t.return,(t.flags&32768)===0){if(i=ux(i,t,Ee),i!==null){ne=i;return}}else{if(i=fx(i,t),i!==null){i.flags&=32767,ne=i;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{ae=6,ne=null;return}}if(t=t.sibling,t!==null){ne=t;return}ne=t=e}while(t!==null);ae===0&&(ae=5)}function ri(e,t,i){var n=F,r=Me.transition;try{Me.transition=null,F=1,wx(e,t,i,n)}finally{Me.transition=r,F=n}return null}function wx(e,t,i,n){do Vi();while(Lt!==null);if((j&6)!==0)throw Error(w(327));i=e.finishedWork;var r=e.finishedLanes;if(i===null)return null;if(e.finishedWork=null,e.finishedLanes=0,i===e.current)throw Error(w(177));e.callbackNode=null,e.callbackPriority=0;var a=i.lanes|i.childLanes;if(nh(e,a),e===le&&(ne=le=null,de=0),(i.subtreeFlags&2064)===0&&(i.flags&2064)===0||Kr||(Kr=!0,Au(sa,function(){return Vi(),null})),a=(i.flags&15990)!==0,(i.subtreeFlags&15990)!==0||a){a=Me.transition,Me.transition=null;var o=F;F=1;var l=j;j|=4,ks.current=null,mx(e,i),Eu(i,e),Vh(yl),pa=!!vl,yl=vl=null,e.current=i,hx(i,e,r),Km(),j=l,F=o,Me.transition=a}else e.current=i;if(Kr&&(Kr=!1,Lt=e,_a=r),a=e.pendingLanes,a===0&&(Dt=null),Xm(i.stateNode,n),Ie(e,ee()),t!==null)for(n=e.onRecoverableError,i=0;i<t.length;i++)r=t[i],n(r.value,{componentStack:r.stack,digest:r.digest});if(Ea)throw Ea=!1,e=Fl,Fl=null,e;return(_a&1)!==0&&e.tag!==0&&Vi(),a=e.pendingLanes,(a&1)!==0?e===Ul?Mn++:(Mn=0,Ul=e):Mn=0,Gt(),null}function Vi(){if(Lt!==null){var e=cc(_a),t=Me.transition,i=F;try{if(Me.transition=null,F=16>e?16:e,Lt===null)var n=!1;else{if(e=Lt,Lt=null,_a=0,(j&6)!==0)throw Error(w(331));var r=j;for(j|=4,_=e.current;_!==null;){var a=_,o=a.child;if((_.flags&16)!==0){var l=a.deletions;if(l!==null){for(var s=0;s<l.length;s++){var d=l[s];for(_=d;_!==null;){var u=_;switch(u.tag){case 0:case 11:case 15:On(8,u,a)}var h=u.child;if(h!==null)h.return=u,_=h;else for(;_!==null;){u=_;var p=u.sibling,x=u.return;if(ku(u),u===d){_=null;break}if(p!==null){p.return=x,_=p;break}_=x}}}var v=a.alternate;if(v!==null){var g=v.child;if(g!==null){v.child=null;do{var k=g.sibling;g.sibling=null,g=k}while(g!==null)}}_=a}}if((a.subtreeFlags&2064)!==0&&o!==null)o.return=a,_=o;else e:for(;_!==null;){if(a=_,(a.flags&2048)!==0)switch(a.tag){case 0:case 11:case 15:On(9,a,a.return)}var f=a.sibling;if(f!==null){f.return=a.return,_=f;break e}_=a.return}}var c=e.current;for(_=c;_!==null;){o=_;var m=o.child;if((o.subtreeFlags&2064)!==0&&m!==null)m.return=o,_=m;else e:for(o=c;_!==null;){if(l=_,(l.flags&2048)!==0)try{switch(l.tag){case 0:case 11:case 15:Ma(9,l)}}catch(S){Z(l,l.return,S)}if(l===o){_=null;break e}var y=l.sibling;if(y!==null){y.return=l.return,_=y;break e}_=l.return}}if(j=r,Gt(),tt&&typeof tt.onPostCommitFiberRoot=="function")try{tt.onPostCommitFiberRoot(Na,e)}catch{}n=!0}return n}finally{F=i,Me.transition=t}}return!1}function Dp(e,t,i){t=$i(i,t),t=cu(e,t,1),e=Mt(e,t,1),t=ve(),e!==null&&(tr(e,1,t),Ie(e,t))}function Z(e,t,i){if(e.tag===3)Dp(e,e,i);else for(;t!==null;){if(t.tag===3){Dp(t,e,i);break}else if(t.tag===1){var n=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof n.componentDidCatch=="function"&&(Dt===null||!Dt.has(n))){e=$i(i,e),e=uu(t,e,1),t=Mt(t,e,1),e=ve(),t!==null&&(tr(t,1,e),Ie(t,e));break}}t=t.return}}function kx(e,t,i){var n=e.pingCache;n!==null&&n.delete(t),t=ve(),e.pingedLanes|=e.suspendedLanes&i,le===e&&(de&i)===i&&(ae===4||ae===3&&(de&130023424)===de&&500>ee()-Is?si(e,0):Ss|=i),Ie(e,t)}function Lu(e,t){t===0&&((e.mode&1)===0?t=1:(t=Ar,Ar<<=1,(Ar&130023424)===0&&(Ar=4194304)));var i=ve();e=yt(e,t),e!==null&&(tr(e,t,i),Ie(e,i))}function Sx(e){var t=e.memoizedState,i=0;t!==null&&(i=t.retryLane),Lu(e,i)}function Ix(e,t){var i=0;switch(e.tag){case 13:var n=e.stateNode,r=e.memoizedState;r!==null&&(i=r.retryLane);break;case 19:n=e.stateNode;break;default:throw Error(w(314))}n!==null&&n.delete(t),Lu(e,i)}var Tu;Tu=function(e,t,i){if(e!==null)if(e.memoizedProps!==t.pendingProps||ke.current)we=!0;else{if((e.lanes&i)===0&&(t.flags&128)===0)return we=!1,cx(e,t,i);we=(e.flags&131072)!==0}else we=!1,q&&(t.flags&1048576)!==0&&Mc(t,xa,t.index);switch(t.lanes=0,t.tag){case 2:var n=t.type;ta(e,t),e=t.pendingProps;var r=Gi(t,me.current);Hi(t,i),r=xs(null,t,n,e,r,i);var a=vs();return t.flags|=1,typeof r=="object"&&r!==null&&typeof r.render=="function"&&r.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,Se(n)?(a=!0,ma(t)):a=!1,t.memoizedState=r.state!==null&&r.state!==void 0?r.state:null,us(t),r.updater=ja,t.stateNode=r,r._reactInternals=t,Rl(t,n,e,i),t=Pl(null,t,n,!0,a,i)):(t.tag=0,q&&a&&as(t),xe(null,t,r,i),t=t.child),t;case 16:n=t.elementType;e:{switch(ta(e,t),e=t.pendingProps,r=n._init,n=r(n._payload),t.type=n,r=t.tag=_x(n),e=Ve(n,e),r){case 0:t=zl(null,t,n,e,i);break e;case 1:t=Rp(null,t,n,e,i);break e;case 11:t=_p(null,t,n,e,i);break e;case 14:t=Cp(null,t,n,Ve(n.type,e),i);break e}throw Error(w(306,n,""))}return t;case 0:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ve(n,r),zl(e,t,n,r,i);case 1:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ve(n,r),Rp(e,t,n,r,i);case 3:e:{if(hu(t),e===null)throw Error(w(387));n=t.pendingProps,a=t.memoizedState,r=a.element,Vc(e,t),ba(t,n,null,i);var o=t.memoizedState;if(n=o.element,a.isDehydrated)if(a={element:n,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},t.updateQueue.baseState=a,t.memoizedState=a,t.flags&256){r=$i(Error(w(423)),t),t=Np(e,t,n,i,r);break e}else if(n!==r){r=$i(Error(w(424)),t),t=Np(e,t,n,i,r);break e}else for(_e=jt(t.stateNode.containerInfo.firstChild),Ce=t,q=!0,Ge=null,i=Bc(t,null,n,i),t.child=i;i;)i.flags=i.flags&-3|4096,i=i.sibling;else{if(Wi(),n===r){t=bt(e,t,i);break e}xe(e,t,n,i)}t=t.child}return t;case 5:return Qc(t),e===null&&El(t),n=t.type,r=t.pendingProps,a=e!==null?e.memoizedProps:null,o=r.children,bl(n,r)?o=null:a!==null&&bl(n,a)&&(t.flags|=32),mu(e,t),xe(e,t,o,i),t.child;case 6:return e===null&&El(t),null;case 13:return xu(e,t,i);case 4:return fs(t,t.stateNode.containerInfo),n=t.pendingProps,e===null?t.child=qi(t,null,n,i):xe(e,t,n,i),t.child;case 11:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ve(n,r),_p(e,t,n,r,i);case 7:return xe(e,t,t.pendingProps,i),t.child;case 8:return xe(e,t,t.pendingProps.children,i),t.child;case 12:return xe(e,t,t.pendingProps.children,i),t.child;case 10:e:{if(n=t.type._context,r=t.pendingProps,a=t.memoizedProps,o=r.value,V(va,n._currentValue),n._currentValue=o,a!==null)if(Ke(a.value,o)){if(a.children===r.children&&!ke.current){t=bt(e,t,i);break e}}else for(a=t.child,a!==null&&(a.return=t);a!==null;){var l=a.dependencies;if(l!==null){o=a.child;for(var s=l.firstContext;s!==null;){if(s.context===n){if(a.tag===1){s=ht(-1,i&-i),s.tag=2;var d=a.updateQueue;if(d!==null){d=d.shared;var u=d.pending;u===null?s.next=s:(s.next=u.next,u.next=s),d.pending=s}}a.lanes|=i,s=a.alternate,s!==null&&(s.lanes|=i),_l(a.return,i,t),l.lanes|=i;break}s=s.next}}else if(a.tag===10)o=a.type===t.type?null:a.child;else if(a.tag===18){if(o=a.return,o===null)throw Error(w(341));o.lanes|=i,l=o.alternate,l!==null&&(l.lanes|=i),_l(o,i,t),o=a.sibling}else o=a.child;if(o!==null)o.return=a;else for(o=a;o!==null;){if(o===t){o=null;break}if(a=o.sibling,a!==null){a.return=o.return,o=a;break}o=o.return}a=o}xe(e,t,r.children,i),t=t.child}return t;case 9:return r=t.type,n=t.pendingProps.children,Hi(t,i),r=De(r),n=n(r),t.flags|=1,xe(e,t,n,i),t.child;case 14:return n=t.type,r=Ve(n,t.pendingProps),r=Ve(n.type,r),Cp(e,t,n,r,i);case 15:return fu(e,t,t.type,t.pendingProps,i);case 17:return n=t.type,r=t.pendingProps,r=t.elementType===n?r:Ve(n,r),ta(e,t),t.tag=1,Se(n)?(e=!0,ma(t)):e=!1,Hi(t,i),pu(t,n,r),Rl(t,n,r,i),Pl(null,t,n,!0,e,i);case 19:return vu(e,t,i);case 22:return gu(e,t,i)}throw Error(w(156,t.tag))};function Au(e,t){return lc(e,t)}function Ex(e,t,i,n){this.tag=e,this.key=i,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=n,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function je(e,t,i,n){return new Ex(e,t,i,n)}function Rs(e){return e=e.prototype,!(!e||!e.isReactComponent)}function _x(e){if(typeof e=="function")return Rs(e)?1:0;if(e!=null){if(e=e.$$typeof,e===ql)return 11;if(e===Kl)return 14}return 2}function Ut(e,t){var i=e.alternate;return i===null?(i=je(e.tag,t,e.key,e.mode),i.elementType=e.elementType,i.type=e.type,i.stateNode=e.stateNode,i.alternate=e,e.alternate=i):(i.pendingProps=t,i.type=e.type,i.flags=0,i.subtreeFlags=0,i.deletions=null),i.flags=e.flags&14680064,i.childLanes=e.childLanes,i.lanes=e.lanes,i.child=e.child,i.memoizedProps=e.memoizedProps,i.memoizedState=e.memoizedState,i.updateQueue=e.updateQueue,t=e.dependencies,i.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},i.sibling=e.sibling,i.index=e.index,i.ref=e.ref,i}function ra(e,t,i,n,r,a){var o=2;if(n=e,typeof e=="function")Rs(e)&&(o=1);else if(typeof e=="string")o=5;else e:switch(e){case Ci:return di(i.children,r,a,t);case Wl:o=8,r|=8;break;case Zo:return e=je(12,i,t,r|2),e.elementType=Zo,e.lanes=a,e;case Jo:return e=je(13,i,t,r),e.elementType=Jo,e.lanes=a,e;case el:return e=je(19,i,t,r),e.elementType=el,e.lanes=a,e;case Qp:return Fa(i,r,a,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Hp:o=10;break e;case Vp:o=9;break e;case ql:o=11;break e;case Kl:o=14;break e;case Ct:o=16,n=null;break e}throw Error(w(130,e==null?e:typeof e,""))}return t=je(o,i,t,r),t.elementType=e,t.type=n,t.lanes=a,t}function di(e,t,i,n){return e=je(7,e,n,t),e.lanes=i,e}function Fa(e,t,i,n){return e=je(22,e,n,t),e.elementType=Qp,e.lanes=i,e.stateNode={isHidden:!1},e}function $o(e,t,i){return e=je(6,e,null,t),e.lanes=i,e}function Yo(e,t,i){return t=je(4,e.children!==null?e.children:[],e.key,t),t.lanes=i,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function Cx(e,t,i,n,r){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=To(0),this.expirationTimes=To(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=To(0),this.identifierPrefix=n,this.onRecoverableError=r,this.mutableSourceEagerHydrationData=null}function Ns(e,t,i,n,r,a,o,l,s){return e=new Cx(e,t,i,l,s),t===1?(t=1,a===!0&&(t|=8)):t=0,a=je(3,null,null,t),e.current=a,a.stateNode=e,a.memoizedState={element:n,isDehydrated:i,cache:null,transitions:null,pendingSuspenseBoundaries:null},us(a),e}function Rx(e,t,i){var n=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:_i,key:n==null?null:""+n,children:e,containerInfo:t,implementation:i}}function Ou(e){if(!e)return Ht;e=e._reactInternals;e:{if(hi(e)!==e||e.tag!==1)throw Error(w(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(Se(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(w(171))}if(e.tag===1){var i=e.type;if(Se(i))return Oc(e,i,t)}return t}function ju(e,t,i,n,r,a,o,l,s){return e=Ns(i,n,!0,e,r,a,o,l,s),e.context=Ou(null),i=e.current,n=ve(),r=Ft(i),a=ht(n,r),a.callback=t??null,Mt(i,a,r),e.current.lanes=r,tr(e,r,n),Ie(e,n),e}function Ua(e,t,i,n){var r=t.current,a=ve(),o=Ft(r);return i=Ou(i),t.context===null?t.context=i:t.pendingContext=i,t=ht(a,o),t.payload={element:e},n=n===void 0?null:n,n!==null&&(t.callback=n),e=Mt(r,t,o),e!==null&&(qe(e,r,o,a),Zr(e,r,o)),o}function Ra(e){return e=e.current,e.child?(e.child.tag===5,e.child.stateNode):null}function Fp(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var i=e.retryLane;e.retryLane=i!==0&&i<t?i:t}}function zs(e,t){Fp(e,t),(e=e.alternate)&&Fp(e,t)}function Nx(){return null}var Mu=typeof reportError=="function"?reportError:function(e){console.error(e)};function Ps(e){this._internalRoot=e}Ba.prototype.render=Ps.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(w(409));Ua(e,t,null,null)};Ba.prototype.unmount=Ps.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;gi(function(){Ua(null,e,null,null)}),t[vt]=null}};function Ba(e){this._internalRoot=e}Ba.prototype.unstable_scheduleHydration=function(e){if(e){var t=gc();e={blockedOn:null,target:e,priority:t};for(var i=0;i<Nt.length&&t!==0&&t<Nt[i].priority;i++);Nt.splice(i,0,e),i===0&&hc(e)}};function Ls(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Ha(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function Up(){}function zx(e,t,i,n,r){if(r){if(typeof n=="function"){var a=n;n=function(){var d=Ra(o);a.call(d)}}var o=ju(t,n,e,0,null,!1,!1,"",Up);return e._reactRootContainer=o,e[vt]=o.current,Wn(e.nodeType===8?e.parentNode:e),gi(),o}for(;r=e.lastChild;)e.removeChild(r);if(typeof n=="function"){var l=n;n=function(){var d=Ra(s);l.call(d)}}var s=Ns(e,0,!1,null,null,!1,!1,"",Up);return e._reactRootContainer=s,e[vt]=s.current,Wn(e.nodeType===8?e.parentNode:e),gi(function(){Ua(t,s,i,n)}),s}function Va(e,t,i,n,r){var a=i._reactRootContainer;if(a){var o=a;if(typeof r=="function"){var l=r;r=function(){var s=Ra(o);l.call(s)}}Ua(t,o,e,r)}else o=zx(i,t,e,r,n);return Ra(o)}uc=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var i=Cn(t.pendingLanes);i!==0&&(Xl(t,i|1),Ie(t,ee()),(j&6)===0&&(Yi=ee()+500,Gt()))}break;case 13:gi(function(){var n=yt(e,1);if(n!==null){var r=ve();qe(n,e,1,r)}}),zs(e,1)}};Zl=function(e){if(e.tag===13){var t=yt(e,134217728);if(t!==null){var i=ve();qe(t,e,134217728,i)}zs(e,134217728)}};fc=function(e){if(e.tag===13){var t=Ft(e),i=yt(e,t);if(i!==null){var n=ve();qe(i,e,t,n)}zs(e,t)}};gc=function(){return F};mc=function(e,t){var i=F;try{return F=e,t()}finally{F=i}};pl=function(e,t,i){switch(t){case"input":if(nl(e,i),t=i.name,i.type==="radio"&&t!=null){for(i=e;i.parentNode;)i=i.parentNode;for(i=i.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<i.length;t++){var n=i[t];if(n!==e&&n.form===e.form){var r=Ta(n);if(!r)throw Error(w(90));Wp(n),nl(n,r)}}}break;case"textarea":Kp(e,i);break;case"select":t=i.value,t!=null&&Di(e,!!i.multiple,t,!1)}};tc=Es;ic=gi;var Px={usingClientEntryPoint:!1,Events:[nr,Pi,Ta,Jp,ec,Es]},Sn={findFiberByHostInstance:ai,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Lx={bundleType:Sn.bundleType,version:Sn.version,rendererPackageName:Sn.rendererPackageName,rendererConfig:Sn.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:wt.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=ac(e),e===null?null:e.stateNode},findFiberByHostInstance:Sn.findFiberByHostInstance||Nx,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(In=__REACT_DEVTOOLS_GLOBAL_HOOK__,!In.isDisabled&&In.supportsFiber))try{Na=In.inject(Lx),tt=In}catch{}var In;ze.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Px;ze.createPortal=function(e,t){var i=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Ls(t))throw Error(w(200));return Rx(e,t,null,i)};ze.createRoot=function(e,t){if(!Ls(e))throw Error(w(299));var i=!1,n="",r=Mu;return t!=null&&(t.unstable_strictMode===!0&&(i=!0),t.identifierPrefix!==void 0&&(n=t.identifierPrefix),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=Ns(e,1,!1,null,null,i,!1,n,r),e[vt]=t.current,Wn(e.nodeType===8?e.parentNode:e),new Ps(t)};ze.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(w(188)):(e=Object.keys(e).join(","),Error(w(268,e)));return e=ac(t),e=e===null?null:e.stateNode,e};ze.flushSync=function(e){return gi(e)};ze.hydrate=function(e,t,i){if(!Ha(t))throw Error(w(200));return Va(null,e,t,!0,i)};ze.hydrateRoot=function(e,t,i){if(!Ls(e))throw Error(w(405));var n=i!=null&&i.hydratedSources||null,r=!1,a="",o=Mu;if(i!=null&&(i.unstable_strictMode===!0&&(r=!0),i.identifierPrefix!==void 0&&(a=i.identifierPrefix),i.onRecoverableError!==void 0&&(o=i.onRecoverableError)),t=ju(t,null,e,1,i??null,r,!1,a,o),e[vt]=t.current,Wn(e),n)for(e=0;e<n.length;e++)i=n[e],r=i._getVersion,r=r(i._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[i,r]:t.mutableSourceEagerHydrationData.push(i,r);return new Ba(t)};ze.render=function(e,t,i){if(!Ha(t))throw Error(w(200));return Va(null,e,t,!1,i)};ze.unmountComponentAtNode=function(e){if(!Ha(e))throw Error(w(40));return e._reactRootContainer?(gi(function(){Va(null,null,e,!1,function(){e._reactRootContainer=null,e[vt]=null})}),!0):!1};ze.unstable_batchedUpdates=Es;ze.unstable_renderSubtreeIntoContainer=function(e,t,i,n){if(!Ha(i))throw Error(w(200));if(e==null||e._reactInternals===void 0)throw Error(w(38));return Va(e,t,i,!1,n)};ze.version="18.3.1-next-f1338f8080-20240426"});var Ts=ct((vv,Uu)=>{"use strict";function Fu(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Fu)}catch(e){console.error(e)}}Fu(),Uu.exports=Du()});var Hu=ct(As=>{"use strict";var Bu=Ts();As.createRoot=Bu.createRoot,As.hydrateRoot=Bu.hydrateRoot;var yv});var $u=ct(Ga=>{"use strict";var Tx=U(),Ax=Symbol.for("react.element"),Ox=Symbol.for("react.fragment"),jx=Object.prototype.hasOwnProperty,Mx=Tx.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Dx={key:!0,ref:!0,__self:!0,__source:!0};function Ku(e,t,i){var n,r={},a=null,o=null;i!==void 0&&(a=""+i),t.key!==void 0&&(a=""+t.key),t.ref!==void 0&&(o=t.ref);for(n in t)jx.call(t,n)&&!Dx.hasOwnProperty(n)&&(r[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps,t)r[n]===void 0&&(r[n]=t[n]);return{$$typeof:Ax,type:e,key:a,ref:o,props:r,_owner:Mx.current}}Ga.Fragment=Ox;Ga.jsx=Ku;Ga.jsxs=Ku});var N=ct((Sv,Yu)=>{"use strict";Yu.exports=$u()});var tm=I(Hu(),1);var Os={representative_test_set:"\u4EE3\u8868\u6027\u6D4B\u8BD5\u96C6",ordinary_normal:"\u666E\u901A\u6B63\u5E38",hard_normal:"\u56F0\u96BE\u826F\u54C1",near_ok_ng_pair:"\u76F8\u4F3C\u5F02\u6807\u7B7E\u5BF9",tiny_defect:"\u5FAE\u5C0F\u5F02\u5E38",low_contrast_defect:"\u4F4E\u5BF9\u6BD4\u5F02\u5E38",structural_relation:"\u7ED3\u6784\u5173\u7CFB",missing_component:"\u7F3A\u5931",misalignment:"\u9519\u4F4D",multi_object:"\u591A\u4EF6\u4E0E\u591A\u5B9E\u4F8B",in_domain:"\u539F\u57DF",unseen_batch:"\u672A\u89C1\u6279\u6B21",lighting_shift:"\u5149\u7167\u53D8\u5316"},Vu={observed:"\u5DF2\u89C2\u5BDF\u5230",candidate:"\u80FD\u529B\u5019\u9009",not_observed:"\u672A\u89C2\u5BDF\u5230",not_applicable:"\u4E0D\u9002\u7528"};var Qu={exploration:"\u89C6\u89C9\u63A2\u7D22",training_experiment:"\u8BAD\u7EC3\u5B9E\u9A8C",debug:"\u5185\u90E8\u8C03\u8BD5",image_evaluation:"\u56FE\u50CF\u7EA7\u8BC4\u6D4B",bbox_evaluation:"\u77E9\u5F62\u6846\u5B9A\u4F4D\u8BC4\u6D4B",pixel_evaluation:"\u50CF\u7D20\u533A\u57DF\u8BC4\u6D4B",formal_benchmark:"\u6B63\u5F0F\u8BC4\u6D4B\u57FA\u51C6"},Gu={usable:"\u53EF\u7528",candidate:"\u53EF\u4F5C\u5019\u9009",not_ready:"\u6761\u4EF6\u4E0D\u8DB3",not_evaluated:"\u672A\u8BC4\u4EF7"},js={ready:"\u5C31\u7EEA",partial:"\u90E8\u5206\u6761\u4EF6\u6EE1\u8DB3",not_ready:"\u6761\u4EF6\u4E0D\u8DB3",not_evaluated:"\u672A\u8BC4\u4EF7"};var xi={image_label_mismatch:"\u7C7B\u522B\u4E0D\u4E00\u81F4",category_mismatch:"\u7C7B\u522B\u4E0D\u4E00\u81F4",extra_annotation:"\u591A\u6807",missing_annotation:"\u5C11\u6807",position_difference:"\u4F4D\u7F6E\u5DEE\u5F02",split:"\u62C6\u5206",merge:"\u5408\u5E76"},Wu={image_label_mismatch:"\u5185\u5BB9\u76F8\u540C\u7684\u4E24\u5F20\u56FE\uFF0C\u6574\u56FE\u6807\u7B7E\u4E0D\u540C\uFF0C\u4F8B\u5982\u4E00\u5F20\u8BB0\u4E3AOK\uFF0C\u53E6\u4E00\u5F20\u8BB0\u4E3ANG\u3002",category_mismatch:"\u540C\u4E00\u76EE\u6807\u5728\u4E24\u5F20\u56FE\u4E2D\u7684\u7C7B\u522B\u8BB0\u5F55\u4E0D\u540C\u3002",extra_annotation:"\u4E3B\u56FE\u6709\u6807\u6CE8\uFF0C\u5BF9\u7167\u56FE\u4E2D\u540C\u4E00\u5904\u53EF\u89C1\u5185\u5BB9\u6CA1\u6709\u76F8\u5E94\u6807\u6CE8\u3002",missing_annotation:"\u5BF9\u7167\u56FE\u6709\u6807\u6CE8\uFF0C\u4E3B\u56FE\u4E2D\u540C\u4E00\u5904\u53EF\u89C1\u5185\u5BB9\u6CA1\u6709\u76F8\u5E94\u6807\u6CE8\u3002",position_difference:"\u4E24\u5F20\u56FE\u90FD\u6807\u4E86\u540C\u4E00\u76EE\u6807\uFF0C\u4F46\u6846\u5708\u4F4F\u7684\u5B9E\u9645\u5185\u5BB9\u6709\u660E\u663E\u5DEE\u522B\uFF0C\u4F8B\u5982\u4E00\u4FA7\u6F0F\u6389\u4E86\u76EE\u6807\u7684\u4E00\u90E8\u5206\u3002",split:"\u540C\u4E00\u7EC4\u53EF\u89C1\u5185\u5BB9\u5728\u4E3B\u56FE\u4E2D\u5206\u6210\u591A\u4E2A\u6846\uFF0C\u5728\u5BF9\u7167\u56FE\u4E2D\u7528\u4E00\u4E2A\u6846\u5708\u4F4F\u3002",merge:"\u540C\u4E00\u7EC4\u53EF\u89C1\u5185\u5BB9\u5728\u4E3B\u56FE\u4E2D\u7528\u4E00\u4E2A\u6846\u5708\u4F4F\uFF0C\u5728\u5BF9\u7167\u56FE\u4E2D\u5206\u6210\u591A\u4E2A\u6846\u3002"},Qa={labelme:["category_mismatch","extra_annotation","missing_annotation","position_difference","split","merge"],folder_classification:["image_label_mismatch"]};var ar={NO_CANDIDATES:"\u65E0\u5019\u9009",NO_ELIGIBLE_CANDIDATES:"\u65E0\u6709\u6548\u5019\u9009","MODEL_REVIEWED:EQUIVALENT":"\u6807\u6CE8\u4E00\u81F4","MODEL_REVIEWED:MATERIAL":"\u6807\u6CE8\u51B2\u7A81","MODEL_REVIEWED:UNCERTAIN":"\u5F85\u6838\u5B9E"},qu={NO_CANDIDATES:"\u68C0\u7D22\u6CA1\u6709\u627E\u5230\u53EF\u4F5C\u5BF9\u7167\u7684\u5176\u4ED6\u56FE\u50CF\u3002",NO_ELIGIBLE_CANDIDATES:"\u627E\u5230\u4E86\u5019\u9009\u56FE\uFF0C\u4F46\u5185\u5BB9\u4E0D\u540C\uFF0C\u6216\u770B\u4E0D\u6E05\u662F\u5426\u62CD\u7684\u662F\u76F8\u540C\u5185\u5BB9\uFF0C\u56E0\u6B64\u6CA1\u6709\u8FDB\u5165\u6807\u6CE8\u6BD4\u8F83\u3002","MODEL_REVIEWED:EQUIVALENT":"\u5DF2\u6709\u5185\u5BB9\u76F8\u540C\u7684\u5BF9\u7167\u56FE\uFF0C\u6BD4\u8F83\u540E\uFF0C\u53CC\u65B9\u6807\u6CE8\u7684\u7C7B\u522B\u3001\u6570\u91CF\u548C\u8986\u76D6\u5173\u7CFB\u76F8\u7B26\u3002","MODEL_REVIEWED:MATERIAL":"\u5DF2\u6709\u5185\u5BB9\u76F8\u540C\u7684\u5BF9\u7167\u56FE\uFF0C\u6BD4\u8F83\u540E\u53D1\u73B0\u81F3\u5C11\u4E00\u5904\u6807\u6CE8\u4E0D\u540C\uFF0C\u5177\u4F53\u5DEE\u522B\u6309\u4E0B\u9762\u7684\u7C7B\u578B\u5F52\u7C7B\u3002","MODEL_REVIEWED:UNCERTAIN":"\u5DF2\u6709\u5185\u5BB9\u76F8\u540C\u7684\u5BF9\u7167\u56FE\uFF0C\u4F46\u90E8\u5206\u6807\u6CE8\u5173\u7CFB\u8FD8\u9700\u8981\u590D\u770B\uFF0C\u4F8B\u5982\u76EE\u6807\u7684\u8FB9\u7F18\u770B\u4E0D\u6E05\u3002"};var Jt=I(U(),1);var Df=I(U(),1);var jf=I(U(),1);var $t=I(U(),1);var Wt=I(U(),1),nt=I(N(),1),Xu=(0,Wt.createContext)(0);function Wa({children:e,className:t="",primarySource:i}){let[n,r]=(0,Wt.useState)(0),[a,o]=(0,Wt.useState)(new Map),[l,s]=(0,Wt.useState)(""),d=!!i&&i!==l;function u(h){let p=h.target,x=p.getAttribute?.("data-media-source");x&&(x===i&&s(x),o(v=>{let g=new Map(v);return h.type==="error"?g.set(x,p.getAttribute("data-media-label")||p.getAttribute("alt")||"\u56FE\u50CF"):g.delete(x),g}))}return(0,nt.jsx)(Xu.Provider,{value:n,children:(0,nt.jsxs)("div",{className:`iad-media-load ${t}`,"aria-busy":i?d:void 0,onErrorCapture:u,onLoadCapture:u,children:[e,d&&(0,nt.jsx)("div",{className:"iad-media-loading",role:"status",children:"\u6B63\u5728\u52A0\u8F7D\u56FE\u50CF\u2026"}),!!a.size&&(0,nt.jsxs)("div",{className:"iad-media-error",role:"alert",children:[[...new Set(a.values())].map(h=>(0,nt.jsxs)("span",{children:[h,"\u65E0\u6CD5\u52A0\u8F7D\uFF0C\u8BF7\u68C0\u67E5\u8D44\u6E90\u662F\u5426\u5B58\u5728\u6216\u5B8C\u6574\u3002"]},h)),(0,nt.jsx)("button",{type:"button","aria-label":"\u91CD\u65B0\u52A0\u8F7D\u56FE\u50CF",onClick:()=>{s(""),o(new Map),r(h=>h+1)},children:"\u91CD\u65B0\u52A0\u8F7D"})]})]})})}function Zu(e){let t=(0,Wt.useContext)(Xu);if(!t)return e;let i=new URL(e,window.location.href);return i.searchParams.set("_retry",String(t)),i.href}function Ji({src:e="",...t}){return(0,nt.jsx)("img",{...t,src:Zu(e),"data-media-source":e})}function Ju({href:e="",...t}){return(0,nt.jsx)("image",{...t,href:Zu(e),"data-media-source":e,"data-media-label":"\u6807\u6CE8\u50CF\u7D20"})}var or=I(U(),1),Fx=I(N(),1),Ux=or.createContext(void 0),ef=e=>{let t=or.useContext(Ux);if(e)return e;if(!t)throw new Error("No QueryClient set, use QueryClientProvider to set one");return t};var Bx={setTimeout:(e,t)=>setTimeout(e,t),clearTimeout:e=>clearTimeout(e),setInterval:(e,t)=>setInterval(e,t),clearInterval:e=>clearInterval(e)},Hx=class{#e=Bx;#t=!1;setTimeoutProvider(e){this.#e=e}setTimeout(e,t){return this.#e.setTimeout(e,t)}clearTimeout(e){this.#e.clearTimeout(e)}setInterval(e,t){return this.#e.setInterval(e,t)}clearInterval(e){this.#e.clearInterval(e)}},rt=new Hx;function tf(e){setTimeout(e,0)}var Ds=typeof window>"u"||"Deno"in globalThis;function te(){}function af(e,t){return typeof e=="function"?e(t):e}function qa(e){return typeof e=="number"&&e>=0&&e!==1/0}function Ka(e,t){return Math.max(e+(t||0)-Date.now(),0)}function B(e,t){return typeof e=="function"?e(t):e}function $a(e,t){let{type:i="all",exact:n,fetchStatus:r,predicate:a,queryKey:o,stale:l}=e;if(o){if(n){if(t.queryHash!==lr(o,t.options))return!1}else if(!qt(t.queryKey,o))return!1}if(i!=="all"){let s=t.isActive();if(i==="active"&&!s||i==="inactive"&&s)return!1}return!(typeof l=="boolean"&&t.isStale()!==l||r&&r!==t.state.fetchStatus||a&&!a(t))}function Ya(e,t){let{exact:i,status:n,predicate:r,mutationKey:a}=e;if(a){if(!t.options.mutationKey)return!1;if(i){if(vi(t.options.mutationKey)!==vi(a))return!1}else if(!qt(t.options.mutationKey,a))return!1}return!(n&&t.state.status!==n||r&&!r(t))}function lr(e,t){return(t?.queryKeyHashFn||vi)(e)}function vi(e){return JSON.stringify(e,(t,i)=>Ms(i)?Object.keys(i).sort().reduce((n,r)=>(n[r]=i[r],n),{}):i)}function qt(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(e&&t&&typeof e=="object"&&typeof t=="object"){if(Array.isArray(e)&&Array.isArray(t)){if(t.length>e.length)return!1;for(let n=0;n<t.length;n++)if(!qt(e[n],t[n]))return!1;return!0}let i=Object.keys(t);for(let n of i)if(!qt(e[n],t[n]))return!1;return!0}return!1}var of=Object.prototype.hasOwnProperty;function Fs(e,t,i=0){if(e===t)return e;if(i>500)return t;let n=nf(e)&&nf(t);if(!n&&!(Ms(e)&&Ms(t)))return t;let r=(n?e:Object.keys(e)).length,a=n?t:Object.keys(t),o=a.length,l=n?new Array(o):{},s=0;for(let d=0;d<o;d++){let u=n?d:a[d],h=e[u],p=t[u];if(h===p){l[u]=h,(n?d<r:of.call(e,u))&&s++;continue}if(h===null||p===null||typeof h!="object"||typeof p!="object"){l[u]=p;continue}let x=Fs(h,p,i+1);l[u]=x,x===h&&s++}return r===o&&s===r?e:l}function Xa(e,t){if(!t||Object.keys(e).length!==Object.keys(t).length)return!1;for(let i of Object.keys(e))if(!of.call(t,i)||e[i]!==t[i])return!1;return!0}function nf(e){return Array.isArray(e)&&e.length===Object.keys(e).length}function Ms(e){if(!rf(e))return!1;let t=Object.getPrototypeOf(e),i=t?.constructor;if(i===void 0)return!0;if(typeof i!="function")return!1;let n=i.prototype;return!(!rf(n)||!n.hasOwnProperty("isPrototypeOf")||t!==Object.prototype)}function rf(e){return Object.prototype.toString.call(e)==="[object Object]"}function lf(e){return new Promise(t=>{rt.setTimeout(t,e)})}function sr(e,t,i){return typeof i.structuralSharing=="function"?i.structuralSharing(e,t):i.structuralSharing!==!1?Fs(e,t):t}function sf(e,t,i=0){let n=[...e,t];return i&&n.length>i?n.slice(-i):n}function df(e,t,i=0){let n=[t,...e];return i&&n.length>i?n.slice(0,i):n}var en=Symbol();function Za(e,t){return!e.queryFn&&t?.initialPromise?()=>t.initialPromise:!e.queryFn||e.queryFn===en?()=>Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)):e.queryFn}function Ja(e,t){return typeof e=="function"?e(...t):!!e}var dr=Symbol();function pf(e,t,i,n){let r=!1,a;return Object.defineProperties(e,{[dr]:{value:n},signal:{enumerable:!0,get:()=>(a??=t(),r||(r=!0,a.aborted?i():a.addEventListener("abort",i,{once:!0})),a)}}),e}var Vx=()=>Ds,tn=()=>Vx();var at=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(e){return this.listeners.add(e),this.onSubscribe(),()=>{this.listeners.delete(e),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}};var Qx=class extends at{#e;#t;#i;constructor(){super(),this.#i=e=>{if(typeof window<"u"&&window.addEventListener){let t=()=>e();return window.addEventListener("visibilitychange",t,!1),()=>{window.removeEventListener("visibilitychange",t)}}}}onSubscribe(){this.#t||this.setEventListener(this.#i)}onUnsubscribe(){this.hasListeners()||(this.#t?.(),this.#t=void 0)}setEventListener(e){this.#i=e,this.#t?.(),this.#t=e(t=>{typeof t=="boolean"?this.setFocused(t):this.onFocus()})}setFocused(e){this.#e!==e&&(this.#e=e,this.onFocus())}onFocus(){let e=this.isFocused();this.listeners.forEach(t=>{t(e)})}isFocused(){return typeof this.#e=="boolean"?this.#e:globalThis.document?.visibilityState!=="hidden"}},nn=new Qx;var cf=tf;function Gx(){let e=[],t=0,i=l=>{l()},n=l=>{l()},r=cf,a=l=>{t?e.push(l):r(()=>{i(l)})},o=()=>{let l=e;e=[],l.length&&r(()=>{n(()=>{l.forEach(s=>{i(s)})})})};return{batch:l=>{let s;t++;try{s=l()}finally{t--,t||o()}return s},batchCalls:l=>(...s)=>{a(()=>{l(...s)})},schedule:a,setNotifyFunction:l=>{i=l},setBatchNotifyFunction:l=>{n=l},setScheduler:l=>{r=l}}}var W=Gx();var Wx=class extends at{#e=!0;#t;#i;constructor(){super(),this.#i=e=>{if(typeof window<"u"&&window.addEventListener){let t=()=>e(!0),i=()=>e(!1);return window.addEventListener("online",t,!1),window.addEventListener("offline",i,!1),()=>{window.removeEventListener("online",t),window.removeEventListener("offline",i)}}}}onSubscribe(){this.#t||this.setEventListener(this.#i)}onUnsubscribe(){this.hasListeners()||(this.#t?.(),this.#t=void 0)}setEventListener(e){this.#i=e,this.#t?.(),this.#t=e(this.setOnline.bind(this))}setOnline(e){this.#e!==e&&(this.#e=e,this.listeners.forEach(t=>{t(e)}))}isOnline(){return this.#e}},rn=new Wx;function qx(e){return Math.min(1e3*2**e,3e4)}function Us(e){return(e??"online")==="online"?rn.isOnline():!0}var eo=class extends Error{constructor(e){super("CancelledError"),this.revert=e?.revert,this.silent=e?.silent}};function to(e){let t=!1,i=0,n,r="pending",a,o,l=new Promise((c,m)=>{a=c,o=m});l.catch(te);let s=()=>r!=="pending",d=c=>{if(!s()){let m=new eo(c);g(m),e.onCancel?.(m)}},u=()=>{t=!0},h=()=>{t=!1},p=()=>nn.isFocused()&&(e.networkMode==="always"||rn.isOnline())&&e.canRun(),x=()=>Us(e.networkMode)&&e.canRun(),v=c=>{s()||(n?.(),r="resolved",a(c))},g=c=>{s()||(n?.(),r="rejected",o(c))},k=c=>new Promise(m=>{n=y=>{(s()||c())&&m(y)},e.onPause?.()}).then(()=>{n=void 0,s()||e.onContinue?.()}),f=()=>{if(s())return;let c,m=i===0?e.initialPromise:void 0;try{c=m??e.fn()}catch(y){c=Promise.reject(y)}Promise.resolve(c).then(v).catch(y=>{if(s())return;let S=e.retry??(tn()?0:3),E=e.retryDelay??qx,R=typeof E=="function"?E(i,y):E,L=S===!0||typeof S=="number"&&i<S||typeof S=="function"&&S(i,y);if(t||!L){g(y);return}i++,e.onFail?.(i,y),lf(R).then(()=>s()||p()?void 0:k(p)).then(()=>{t?g(y):f()})})};return{promise:l,status:()=>r,cancel:d,continue:()=>(n?.(),l),cancelRetry:u,continueRetry:h,canStart:x,start:()=>(x()?f():k(x).then(f),l)}}var io=class{#e;destroy(){this.clearGcTimeout()}scheduleGc(){this.clearGcTimeout(),qa(this.gcTime)&&(this.#e=rt.setTimeout(()=>{this.optionalRemove()},this.gcTime))}updateGcTime(e){this.gcTime=Math.max(this.gcTime||0,e??(tn()?1/0:3e5))}clearGcTimeout(){this.#e!==void 0&&(rt.clearTimeout(this.#e),this.#e=void 0)}};function ff(e){return{onFetch:(t,i)=>{let n=t.options,r=t.fetchOptions?.meta?.fetchMore?.direction,a=t.state.data?.pages||[],o=t.state.data?.pageParams||[],l={pages:[],pageParams:[]},s=0,d=async()=>{let u=!1,h=t,p=g=>{pf(g,()=>t.signal,()=>u=!0,h[dr])},x=Za(t.options,t.fetchOptions),v=async(g,k,f)=>{if(u)return Promise.reject(t.signal.reason);if(k==null&&g.pages.length)return Promise.resolve(g);let m=(()=>{let R={client:t.client,queryKey:t.queryKey,pageParam:k,direction:f?"backward":"forward",meta:t.options.meta};return p(R),R})(),y=await x(m),{maxPages:S}=t.options,E=f?df:sf;return{pages:E(g.pages,y,S),pageParams:E(g.pageParams,k,S)}};if(r&&a.length){let g=r==="backward",k=g?Kx:uf,f={pages:a,pageParams:o};l=await v(f,k(n,f),g)}else{let g=e??a.length;do{let k=s===0?o[0]===void 0?n.initialPageParam:o[0]:uf(n,l);if(s>0&&k==null)break;l=await v(l,k),s++}while(s<g)}return l};t.options.persister?t.fetchFn=()=>t.options.persister?.(d,{client:t.client,queryKey:t.queryKey,meta:t.options.meta,signal:t.signal},i):t.fetchFn=d}}}function uf(e,{pages:t,pageParams:i}){let n=t.length-1;return t.length>0?e.getNextPageParam(t[n],t,i[n],i):void 0}function Kx(e,{pages:t,pageParams:i}){return t.length>0?e.getPreviousPageParam?.(t[0],t,i[0],i):void 0}var hf=class extends io{#e;#t;#i;#n;#a;#r;#o;#s;#d;constructor(e){super(),this.#d=!1,this.#s=e.defaultOptions,this.setOptions(e.options),this.observers=[],this.#a=e.client,this.#n=this.#a.getQueryCache(),this.queryKey=e.queryKey,this.queryHash=e.queryHash,this.#t=mf(this.options),this.state=e.state??this.#t,this.scheduleGc()}get meta(){return this.options.meta}get queryType(){return this.#e}get promise(){return this.#r?.promise}setOptions(e){if(this.options={...this.#s,...e},e?._type&&(this.#e=e._type),this.updateGcTime(this.options.gcTime),this.state&&this.state.data===void 0){let t=mf(this.options);t.data!==void 0&&(this.setState(gf(t.data,t.dataUpdatedAt)),this.#t=t)}}optionalRemove(){!this.observers.length&&this.state.fetchStatus==="idle"&&this.#n.remove(this)}setData(e,t){let i=sr(this.state.data,e,this.options);return this.#l({data:i,type:"success",dataUpdatedAt:t?.updatedAt,manual:t?.manual}),i}setState(e){this.#l({type:"setState",state:e})}cancel(e){let t=this.#r?.promise;return this.#r?.cancel(e),t?t.then(te).catch(te):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}get resetState(){return this.#t}reset(){this.destroy(),this.setState(this.resetState)}isActive(){return this.observers.some(e=>B(e.options.enabled,this)!==!1)}isDisabled(){return this.getObserversCount()>0?!this.isActive():this.options.queryFn===en||!this.isFetched()}isFetched(){return this.state.dataUpdateCount+this.state.errorUpdateCount>0}isStatic(){return this.state.data===void 0?!1:this.getObserversCount()>0?this.observers.some(e=>B(e.options.staleTime,this)==="static"):!1}isStale(){return this.getObserversCount()>0?this.observers.some(e=>e.getCurrentResult().isStale):this.state.data===void 0||this.state.isInvalidated}isStaleByTime(e=0){return this.state.data===void 0?!0:e==="static"?!1:this.state.isInvalidated?!0:!Ka(this.state.dataUpdatedAt,e)}onFocus(){this.observers.find(e=>e.shouldFetchOnWindowFocus())?.refetch({cancelRefetch:!1}),this.#r?.continue()}onOnline(){this.observers.find(e=>e.shouldFetchOnReconnect())?.refetch({cancelRefetch:!1}),this.#r?.continue()}addObserver(e){this.observers.includes(e)||(this.observers.push(e),this.clearGcTimeout(),this.#n.notify({type:"observerAdded",query:this,observer:e}))}removeObserver(e){let t=this.observers.indexOf(e);t!==-1&&(this.observers.splice(t,1),this.observers.length||(this.#r&&(this.#d||this.state.fetchStatus==="paused"&&this.state.status==="pending"?this.#r.cancel({revert:!0}):this.#r.cancelRetry()),this.scheduleGc()),this.#n.notify({type:"observerRemoved",query:this,observer:e}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||this.#l({type:"invalidate"})}async fetch(e,t){if(this.state.fetchStatus!=="idle"&&this.#r?.status()!=="rejected"){if(this.state.data!==void 0&&t?.cancelRefetch)this.cancel({silent:!0});else if(this.#r&&this.#o)return this.#r.continueRetry(),this.#o}if(e&&this.setOptions(e),!this.options.queryFn){let d=this.observers.find(u=>u.options.queryFn);d&&this.setOptions(d.options)}let i=new AbortController,n=d=>{Object.defineProperties(d,{[dr]:{value:i.signal,enumerable:!0},signal:{enumerable:!0,get:()=>(this.#d=!0,i.signal)}})},r=()=>{let d=Za(this.options,t),h=(()=>{let p={client:this.#a,queryKey:this.queryKey,meta:this.meta};return n(p),p})();return this.#d=!1,this.options.persister?this.options.persister(d,h,this):d(h)},o=(()=>{let d={fetchOptions:t,options:this.options,queryKey:this.queryKey,client:this.#a,state:this.state,fetchFn:r};return n(d),d})();(this.#e==="infinite"?ff(this.options.pages):this.options.behavior)?.onFetch(o,this),this.#i=this.state,(this.state.fetchStatus==="idle"||this.state.fetchMeta!==o.fetchOptions?.meta)&&this.#l({type:"fetch",meta:o.fetchOptions?.meta});let l=this.#r=to({initialPromise:t?.initialPromise,fn:o.fetchFn,onCancel:d=>{d instanceof eo&&d.revert&&this.setState({...this.#i,fetchStatus:"idle"}),i.abort()},onFail:(d,u)=>{this.#l({type:"failed",failureCount:d,error:u})},onPause:()=>{this.#l({type:"pause"})},onContinue:()=>{this.#l({type:"continue"})},retry:o.options.retry,retryDelay:o.options.retryDelay,networkMode:o.options.networkMode,canRun:()=>!0}),s=(async()=>{try{let d=await l.promise;if(d===void 0)throw new Error(`${this.queryHash} data is undefined`);return this.setData(d),this.#n.config.onSuccess?.(d,this),this.#n.config.onSettled?.(d,this.state.error,this),d}catch(d){if(d instanceof eo){if(d.silent){if(this.#r!==l&&this.#o)return this.#o;throw d}else if(d.revert){if(this.state.data===void 0)throw d;return this.state.data}}throw this.#l({type:"error",error:d}),this.#n.config.onError?.(d,this),this.#n.config.onSettled?.(this.state.data,d,this),d}finally{this.#r===l&&(this.#r=void 0,this.#o=void 0),this.scheduleGc()}})();return this.#o=s,l.start(),s}#l(e){let t=i=>{switch(e.type){case"failed":return{...i,fetchFailureCount:e.failureCount,fetchFailureReason:e.error};case"pause":return{...i,fetchStatus:"paused"};case"continue":return{...i,fetchStatus:"fetching"};case"fetch":return{...i,...Bs(i.data,this.options),fetchMeta:e.meta??null};case"success":let n={...i,...gf(e.data,e.dataUpdatedAt),dataUpdateCount:i.dataUpdateCount+1,...!e.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};return this.#i=e.manual?n:void 0,n;case"error":let r=e.error;return{...i,error:r,errorUpdateCount:i.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:i.fetchFailureCount+1,fetchFailureReason:r,fetchStatus:"idle",status:"error",isInvalidated:!0};case"invalidate":return{...i,isInvalidated:!0};case"setState":return{...i,...e.state}}};this.state=t(this.state),W.batch(()=>{this.observers.slice().forEach(i=>{i.onQueryUpdate()}),this.#n.notify({query:this,type:"updated",action:e})})}};function Bs(e,t){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:Us(t.networkMode)?"fetching":"paused",...e===void 0&&{error:null,status:"pending"}}}function gf(e,t){return{data:e,dataUpdatedAt:t??Date.now(),error:null,isInvalidated:!1,status:"success"}}function mf(e){let t=typeof e.initialData=="function"?e.initialData():e.initialData,i=t!==void 0,n=i?typeof e.initialDataUpdatedAt=="function"?e.initialDataUpdatedAt():e.initialDataUpdatedAt:0;return{data:t,dataUpdateCount:0,dataUpdatedAt:i?n??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:i?"success":"pending",fetchStatus:"idle"}}var Vs=class extends at{#e;#t=void 0;#i=void 0;#n=void 0;#a;#r;#o;#s;#d;#l;#c;#u;#p;#g=new Set;constructor(e,t){super(),this.options=t,this.#e=e,this.#o=null,this.bindMethods(),this.setOptions(t)}bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(this.#t.addObserver(this),xf(this.#t,this.options)?this.#f():this.updateResult(),this.#y())}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return Hs(this.#t,this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return Hs(this.#t,this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,this.#b(),this.#w(),this.#t.removeObserver(this)}setOptions(e){let t=this.options,i=this.#t;if(this.options=this.#e.defaultQueryOptions(e),this.options.enabled!==void 0&&typeof this.options.enabled!="boolean"&&typeof this.options.enabled!="function"&&typeof B(this.options.enabled,this.#t)!="boolean")throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");this.#k(),this.#t.setOptions(this.options),t._defaulted&&!Xa(this.options,t)&&this.#e.getQueryCache().notify({type:"observerOptionsUpdated",query:this.#t,observer:this});let n=this.hasListeners();n&&vf(this.#t,i,this.options,t)&&this.#f(),this.updateResult(),n&&(this.#t!==i||B(this.options.enabled,this.#t)!==B(t.enabled,this.#t)||B(this.options.staleTime,this.#t)!==B(t.staleTime,this.#t))&&this.#h();let r=this.#x();n&&(this.#t!==i||B(this.options.enabled,this.#t)!==B(t.enabled,this.#t)||r!==this.#p)&&this.#v(r)}getOptimisticResult(e){let t=this.#e.getQueryCache().build(this.#e,e),i=this.createResult(t,e);return Xa(this.getCurrentResult(),i)||(this.#n=i,this.#r=this.options,this.#a=this.#t.state),i}getCurrentResult(){return this.#n}trackResult(e,t){return new Proxy(e,{get:(i,n)=>(this.trackProp(n),t?.(n),Reflect.get(i,n))})}trackProp(e){this.#g.add(e)}getCurrentQuery(){return this.#t}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){let t=this.#e.defaultQueryOptions(e),i=this.#e.getQueryCache().build(this.#e,t),n=()=>{},r,a=new Promise(o=>{r=o,n=this.#e.getQueryCache().subscribe(l=>{l.type==="updated"&&l.query.queryHash===i.queryHash&&i.state.data!==void 0&&(n(),o(this.createResult(i,t)))})});return Promise.race([i.fetch(t).then(()=>{let o=this.createResult(i,t);return r?.(o),o}).finally(()=>{n()}),a])}fetch(e){return this.#f({...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),this.#n))}#f(e){this.#k();let t=this.#t.fetch(this.options,e);return e?.throwOnError||(t=t.catch(te)),t}#m(e){return!tn()&&B(this.options.enabled,this.#t)!==!1&&qa(e)}#h(){this.#b();let e=B(this.options.staleTime,this.#t);if(this.#n.isStale||!this.#m(e))return;let t=Ka(this.#n.dataUpdatedAt,e)+1;this.#c=rt.setTimeout(()=>{this.#n.isStale||this.updateResult()},t)}#x(){return B(this.options.refetchInterval,this.#t)??!1}#v(e){this.#w(),this.#p=e,!(this.#p===0||!this.#m(this.#p))&&(this.#u=rt.setInterval(()=>{(this.options.refetchIntervalInBackground||nn.isFocused())&&this.#f()},this.#p))}#y(){this.#h(),this.#v(this.#x())}#b(){this.#c!==void 0&&(rt.clearTimeout(this.#c),this.#c=void 0)}#w(){this.#u!==void 0&&(rt.clearInterval(this.#u),this.#u=void 0)}createResult(e,t){let i=this.#t,n=this.options,r=this.#n,a=this.#a,o=this.#r,l=e!==i?e.state:this.#i,{state:s}=e,d={...s},u=!1,h;if(t._optimisticResults){let S=this.hasListeners(),E=!S&&xf(e,t),R=S&&vf(e,i,t,n);(E||R)&&(d={...d,...Bs(s.data,e.options)}),t._optimisticResults==="isRestoring"&&(d.fetchStatus="idle")}let{error:p,errorUpdatedAt:x,status:v}=d;h=d.data;let g=!1;if(t.placeholderData!==void 0&&h===void 0&&v==="pending"){let S;r?.isPlaceholderData&&t.placeholderData===o?.placeholderData?(S=r.data,g=!0):S=typeof t.placeholderData=="function"?t.placeholderData(this.#l?.state.data,this.#l):t.placeholderData,S!==void 0&&(v="success",h=sr(r?.data,S,t),u=!0)}if(t.select&&h!==void 0&&!g)if(r&&h===a?.data&&t.select===this.#s)h=this.#d;else try{this.#s=t.select,h=t.select(h),h=sr(r?.data,h,t),this.#d=h,this.#o=null}catch(S){this.#o=S}else h===void 0&&(this.#o=null);this.#o&&(p=this.#o,h=this.#d,x=Date.now(),v="error",u=!1);let k=d.fetchStatus==="fetching",f=v==="pending",c=v==="error",m=f&&k,y=h!==void 0;return{status:v,fetchStatus:d.fetchStatus,isPending:f,isSuccess:v==="success",isError:c,isInitialLoading:m,isLoading:m,data:h,dataUpdatedAt:d.dataUpdatedAt,error:p,errorUpdatedAt:x,failureCount:d.fetchFailureCount,failureReason:d.fetchFailureReason,errorUpdateCount:d.errorUpdateCount,isFetched:e.isFetched(),isFetchedAfterMount:d.dataUpdateCount>l.dataUpdateCount||d.errorUpdateCount>l.errorUpdateCount,isFetching:k,isRefetching:k&&!f,isLoadingError:c&&!y,isPaused:d.fetchStatus==="paused",isPlaceholderData:u,isRefetchError:c&&y,isStale:Qs(e,t),refetch:this.refetch,isEnabled:B(t.enabled,e)!==!1}}updateResult(){let e=this.#n,t=this.createResult(this.#t,this.options);if(this.#a=this.#t.state,this.#r=this.options,this.#a.data!==void 0&&(this.#l=this.#t),Xa(t,e))return;this.#n=t;let n=(()=>{if(!e)return!0;let{notifyOnChangeProps:r}=this.options,a=typeof r=="function"?r():r;if(a==="all"||!a&&!this.#g.size||this.options.throwOnError&&this.#n.error!==e.error)return!0;for(let o of a??this.#g)if(this.#n[o]!==e[o])return!0;return!1})();W.batch(()=>{n&&this.listeners.forEach(r=>{r(this.#n)}),this.#e.getQueryCache().notify({query:this.#t,type:"observerResultsUpdated"})})}#k(){let e=this.#e.getQueryCache().build(this.#e,this.options);if(e===this.#t)return;let t=this.#t;this.#t=e,this.#i=e.state,this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}onQueryUpdate(){this.updateResult(),this.hasListeners()&&this.#y()}};function $x(e,t){return B(t.enabled,e)!==!1&&e.state.data===void 0&&!(e.state.status==="error"&&B(t.retryOnMount,e)===!1)}function xf(e,t){return $x(e,t)||e.state.data!==void 0&&Hs(e,t,t.refetchOnMount)}function Hs(e,t,i){if(B(t.enabled,e)!==!1&&B(t.staleTime,e)!=="static"){let n=B(i,e);return n==="always"||n!==!1&&Qs(e,t)}return!1}function vf(e,t,i,n){return(e!==t||B(n.enabled,e)===!1)&&(!i.suspense||e.state.status!=="error")&&Qs(e,i)}function Qs(e,t){return B(t.enabled,e)!==!1&&e.isStaleByTime(B(t.staleTime,e))}var yf=class extends io{#e;#t;#i;#n;constructor(e){super(),this.#e=e.client,this.mutationId=e.mutationId,this.#i=e.mutationCache,this.#t=[],this.state=e.state||Yx(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){this.#t.includes(e)||(this.#t.push(e),this.clearGcTimeout(),this.#i.notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){this.#t=this.#t.filter(t=>t!==e),this.scheduleGc(),this.#i.notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){this.#t.length||(this.state.status==="pending"?this.scheduleGc():this.#i.remove(this))}continue(){return this.#n?.continue()??(this.state.status==="pending"?this.execute(this.state.variables):Promise.resolve())}async execute(e){let t=()=>{this.#a({type:"continue"})},i={client:this.#e,meta:this.options.meta,mutationKey:this.options.mutationKey},n=this.#n=to({fn:()=>this.options.mutationFn?this.options.mutationFn(e,i):Promise.reject(new Error("No mutationFn found")),onFail:(o,l)=>{this.#a({type:"failed",failureCount:o,error:l})},onPause:()=>{this.#a({type:"pause"})},onContinue:t,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>this.#i.canRun(this)}),r=this.state.status==="pending",a=!n.canStart();try{if(r)t();else{this.#a({type:"pending",variables:e,isPaused:a}),this.#i.config.onMutate&&await this.#i.config.onMutate(e,this,i);let l=await this.options.onMutate?.(e,i);l!==this.state.context&&this.#a({type:"pending",context:l,variables:e,isPaused:a})}this.state.isPaused&&n.canStart()&&t();let o=await n.start();return await this.#i.config.onSuccess?.(o,e,this.state.context,this,i),await this.options.onSuccess?.(o,e,this.state.context,i),await this.#i.config.onSettled?.(o,null,this.state.variables,this.state.context,this,i),await this.options.onSettled?.(o,null,e,this.state.context,i),this.#a({type:"success",data:o}),o}catch(o){try{await this.#i.config.onError?.(o,e,this.state.context,this,i)}catch(l){Promise.reject(l)}try{await this.options.onError?.(o,e,this.state.context,i)}catch(l){Promise.reject(l)}try{await this.#i.config.onSettled?.(void 0,o,this.state.variables,this.state.context,this,i)}catch(l){Promise.reject(l)}try{await this.options.onSettled?.(void 0,o,e,this.state.context,i)}catch(l){Promise.reject(l)}throw this.#a({type:"error",error:o}),o}finally{this.#n===n&&(this.#n=void 0),this.#i.runNext(this)}}#a(e){let t=i=>{switch(e.type){case"failed":return{...i,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...i,isPaused:!0};case"continue":return{...i,isPaused:!1};case"pending":return{...i,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...i,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...i,data:void 0,error:e.error,failureCount:i.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}};this.state=t(this.state),W.batch(()=>{this.#t.forEach(i=>{i.onMutationUpdate(e)}),this.#i.notify({mutation:this,type:"updated",action:e})})}};function Yx(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}var bf=class extends at{#e;#t;#i;constructor(e={}){super(),this.config=e,this.#e=new Set,this.#t=new Map,this.#i=0}build(e,t,i){let n=new yf({client:e,mutationCache:this,mutationId:++this.#i,options:e.defaultMutationOptions(t),state:i});return this.add(n),n}add(e){this.#e.add(e);let t=no(e);if(typeof t=="string"){let i=this.#t.get(t);i?i.push(e):this.#t.set(t,[e])}this.notify({type:"added",mutation:e})}remove(e){if(this.#e.delete(e)){let t=no(e);if(typeof t=="string"){let i=this.#t.get(t);if(i)if(i.length>1){let n=i.indexOf(e);n!==-1&&i.splice(n,1)}else i[0]===e&&this.#t.delete(t)}}this.notify({type:"removed",mutation:e})}canRun(e){let t=no(e);if(typeof t=="string"){let i=this.#t.get(t)?.find(n=>n.state.status==="pending");return!i||i===e}else return!0}runNext(e){let t=no(e);return typeof t=="string"?this.#t.get(t)?.find(i=>i!==e&&i.state.isPaused)?.continue()??Promise.resolve():Promise.resolve()}clear(){W.batch(()=>{let e=this.getAll();this.#e.clear(),this.#t.clear(),e.forEach(t=>{this.notify({type:"removed",mutation:t})})})}getAll(){return Array.from(this.#e)}find(e){let t={exact:!0,...e};return this.getAll().find(i=>Ya(t,i))}findAll(e={}){return this.getAll().filter(t=>Ya(e,t))}notify(e){W.batch(()=>{this.listeners.forEach(t=>{t(e)})})}resumePausedMutations(){let e=this.getAll().filter(t=>t.state.isPaused);return W.batch(()=>Promise.all(e.map(t=>t.continue().catch(te))))}};function no(e){return e.options.scope?.id}var wf=class extends at{#e;constructor(e={}){super(),this.config=e,this.#e=new Map}build(e,t,i){let n=t.queryKey,r=t.queryHash??lr(n,t),a=this.get(r);return a||(a=new hf({client:e,queryKey:n,queryHash:r,options:e.defaultQueryOptions(t),state:i,defaultOptions:e.getQueryDefaults(n)}),this.add(a)),a}add(e){this.#e.has(e.queryHash)||(this.#e.set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){this.#e.get(e.queryHash)===e&&(e.destroy(),this.#e.delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){W.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return this.#e.get(e)}getAll(){return[...this.#e.values()]}find(e){let t={exact:!0,...e};return this.getAll().find(i=>$a(t,i))}findAll(e={}){let t=this.getAll();return Object.keys(e).length>0?t.filter(i=>$a(e,i)):t}notify(e){W.batch(()=>{this.listeners.forEach(t=>{t(e)})})}onFocus(){W.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){W.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}};var Gs=class{#e;#t;#i;#n;#a;#r;#o;#s;constructor(e={}){this.#e=e.queryCache||new wf,this.#t=e.mutationCache||new bf,this.#i=e.defaultOptions||{},this.#n=new Map,this.#a=new Map,this.#r=0}mount(){this.#r++,this.#r===1&&(this.#o=nn.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#e.onFocus())}),this.#s=rn.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#e.onOnline())}))}unmount(){this.#r--,this.#r===0&&(this.#o?.(),this.#o=void 0,this.#s?.(),this.#s=void 0)}isFetching(e){return this.#e.findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return this.#t.findAll({...e,status:"pending"}).length}getQueryData(e){let t=this.defaultQueryOptions({queryKey:e});return this.#e.get(t.queryHash)?.state.data}ensureQueryData(e){let t=this.defaultQueryOptions(e),i=this.#e.build(this,t),n=i.state.data;return n===void 0?this.fetchQuery(e):(e.revalidateIfStale&&i.isStaleByTime(B(t.staleTime,i))&&this.prefetchQuery(t),Promise.resolve(n))}getQueriesData(e){return this.#e.findAll(e).map(({queryKey:t,state:i})=>[t,i.data])}setQueryData(e,t,i){let n=this.defaultQueryOptions({queryKey:e}),r=this.#e.get(n.queryHash)?.state.data,a=af(t,r);if(a!==void 0)return this.#e.build(this,n).setData(a,{...i,manual:!0})}setQueriesData(e,t,i){return W.batch(()=>this.#e.findAll(e).map(({queryKey:n})=>[n,this.setQueryData(n,t,i)]))}getQueryState(e){let t=this.defaultQueryOptions({queryKey:e});return this.#e.get(t.queryHash)?.state}removeQueries(e){let t=this.#e;W.batch(()=>{t.findAll(e).forEach(i=>{t.remove(i)})})}resetQueries(e,t){let i=this.#e;return W.batch(()=>{let n=i.findAll(e),r=new Set(n);return n.forEach(a=>{a.reset()}),this.refetchQueries({type:"active",predicate:a=>r.has(a)},t)})}cancelQueries(e,t={}){let i={revert:!0,...t},n=W.batch(()=>this.#e.findAll(e).map(r=>r.cancel(i)));return Promise.all(n).then(te).catch(te)}invalidateQueries(e,t={}){return W.batch(()=>(this.#e.findAll(e).forEach(i=>{i.invalidate()}),e?.refetchType==="none"?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},t)))}refetchQueries(e,t={}){let i={...t,cancelRefetch:t.cancelRefetch??!0},n=W.batch(()=>this.#e.findAll(e).filter(r=>!r.isDisabled()&&!r.isStatic()).map(r=>{let a=r.fetch(void 0,i),o=r.state.fetchStatus==="paused";return(!i.throwOnError||o)&&(a=a.catch(te)),o?Promise.resolve():a}));return Promise.all(n).then(te)}async query(e){let t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);let i=this.#e.build(this,t),n=i.isStaleByTime(B(t.staleTime,i))?await i.fetch(t):i.state.data,r=t.select;return r?r(n):n}fetchQuery(e){let t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);let i=this.#e.build(this,t);return i.isStaleByTime(B(t.staleTime,i))?i.fetch(t):Promise.resolve(i.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(te).catch(te)}infiniteQuery(e){return e._type="infinite",this.query(e)}fetchInfiniteQuery(e){return e._type="infinite",this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(te).catch(te)}ensureInfiniteQueryData(e){return e._type="infinite",this.ensureQueryData(e)}resumePausedMutations(){return rn.isOnline()?this.#t.resumePausedMutations():Promise.resolve()}getQueryCache(){return this.#e}getMutationCache(){return this.#t}getDefaultOptions(){return this.#i}setDefaultOptions(e){this.#i=e}setQueryDefaults(e,t){this.#n.set(vi(e),{queryKey:e,defaultOptions:t})}getQueryDefaults(e){let t=[...this.#n.values()],i={};return t.forEach(n=>{qt(e,n.queryKey)&&Object.assign(i,n.defaultOptions)}),i}setMutationDefaults(e,t){this.#a.set(vi(e),{mutationKey:e,defaultOptions:t})}getMutationDefaults(e){let t=[...this.#a.values()],i={};return t.forEach(n=>{qt(e,n.mutationKey)&&Object.assign(i,n.defaultOptions)}),i}defaultQueryOptions(e){if(e._defaulted)return e;let t={...this.#i.queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return t.queryHash||(t.queryHash=lr(t.queryKey,t)),t.refetchOnReconnect===void 0&&(t.refetchOnReconnect=t.networkMode!=="always"),t.throwOnError===void 0&&(t.throwOnError=!!t.suspense),!t.networkMode&&t.persister&&(t.networkMode="offlineFirst"),t.queryFn===en&&(t.enabled=!1),t}defaultMutationOptions(e){return e?._defaulted?e:{...this.#i.mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){this.#e.clear(),this.#t.clear()}};var ro=I(U(),1),kf=ro.createContext(!1),Sf=()=>ro.useContext(kf),$y=kf.Provider;var pr=I(U(),1),Xx=I(N(),1);function Zx(){let e=!1;return{clearReset:()=>{e=!1},reset:()=>{e=!0},isReset:()=>e}}var Jx=pr.createContext(Zx()),If=()=>pr.useContext(Jx);var Ef=I(U(),1);var _f=(e,t,i)=>{let n=i?.state.status==="error"&&typeof e.throwOnError=="function"?Ja(e.throwOnError,[i.state.error,i]):e.throwOnError;(e.suspense||n)&&(t.isReset()||(e.retryOnMount=!1))},Cf=e=>{Ef.useEffect(()=>{e.clearReset()},[e])},Rf=({result:e,errorResetBoundary:t,throwOnError:i,query:n,suspense:r})=>e.isError&&!t.isReset()&&!e.isFetching&&n&&(r&&e.data===void 0||Ja(i,[e.error,n]));var Nf=e=>{if(e.suspense){let i=r=>r==="static"?r:Math.max(r??1e3,1e3),n=e.staleTime;e.staleTime=typeof n=="function"?(...r)=>i(n(...r)):i(n),typeof e.gcTime=="number"&&(e.gcTime=Math.max(e.gcTime,1e3))}},zf=(e,t)=>e?.suspense&&t.isPending,Pf=(e,t,i)=>t.fetchOptimistic(e).catch(()=>{i.clearReset()});var Kt=I(U(),1);function Lf(e,t,i){let n=Sf(),r=If(),a=ef(i),o=a.defaultQueryOptions(e),l=a.getQueryCache().get(o.queryHash),s=e.subscribed!==!1;o._optimisticResults=n?"isRestoring":s?"optimistic":void 0,Nf(o),_f(o,r,l),Cf(r);let[d]=Kt.useState(()=>new t(a,o)),u=d.getOptimisticResult(o);Kt.useEffect(()=>{d.setOptions(o)},[o,d]);let h=!n&&s;if(Kt.useSyncExternalStore(Kt.useCallback(p=>{let x=h?d.subscribe(W.batchCalls(p)):te;return d.updateResult(),x},[d,h]),()=>d.getCurrentResult(),()=>d.getCurrentResult()),zf(o,u))throw Pf(o,d,r);if(Rf({result:u,errorResetBoundary:r,throwOnError:o.throwOnError,query:l,suspense:o.suspense}))throw u.error;return o.notifyOnChangeProps?u:d.trackResult(u)}function Ws(e,t){return Lf(e,Vs,t)}var cr=new Gs({defaultOptions:{queries:{staleTime:1e3,gcTime:300*1e3,retry:!1,refetchOnWindowFocus:!1}}});var qs=class extends Error{constructor(i,n,r){super(n);this.code=i;this.status=r;this.name="ApiError"}code;status};async function Ks(e,t,i,n){let r=t instanceof FormData,a=await fetch("/api/iad"+e,{method:i||(t===void 0?"GET":"POST"),headers:t===void 0||r?void 0:{"Content-Type":"application/json"},body:t===void 0?void 0:r?t:JSON.stringify(t),signal:n}),o=await a.json();if(!a.ok)throw new qs(o.error?.code,o.error?.message||`\u8BF7\u6C42\u5931\u8D25 (${a.status})`,a.status);return!["GET","HEAD"].includes((i||(t===void 0?"GET":"POST")).toUpperCase())&&e!=="/datasets/preview"&&cr.invalidateQueries({queryKey:["iad"]},{cancelRefetch:!1}),o}var Tf={raw_label_filters:[],annotation_filters:[],model_status:"all",review_status:"all",technical:"all",reference_status:"all",search:"",sort_by:"default"},ev={...Tf,review_status:"pending"};var Af=(e,t="image")=>`/api/iad/media/sample/${encodeURIComponent(e.task_id)}/${encodeURIComponent(e.sample_id)}/${t}${t==="thumbnail"?"?size=240":""}`,ao=e=>e instanceof Error?e.message:String(e);var an=(e,t)=>`/api/iad/evidence/${encodeURIComponent(e)}/${encodeURIComponent(t.evidence_id)}`;var $s={annotation:"Labelme \u7EBF\u7D22",model:"MLLM \u5019\u9009",coverage:"\u7EC6\u8282\u8986\u76D6"},oo=e=>new Map([e.overview,...e.regions.map(t=>t.image),...e.auxiliary_evidence,...e.reference_evidence].map(t=>[t.evidence_id,t]));var Pe=I(N(),1);function ur({source:e,viewport:t,fit:i="stretch"}){let n=(0,$t.useId)(),[r,a]=e.kind==="sample"?[e.sample.width,e.sample.height]:e.kind==="boxes"?[e.width,e.height]:e.analysis.overview.original_size,o=e.kind!=="audit"?e.annotations.filter(g=>g.geometry_status!=="INVALID"):[],l=e.kind==="sample"?e.annotations.filter(g=>g.geometry_status!=="INVALID"&&g.annotation_type==="mask").map(g=>({id:g.annotation_id,bbox:[0,0,r,a],url:e.maskUrls?.[g.annotation_id]||`${Af(e.sample,"mask")}?${new URLSearchParams({annotation_id:g.annotation_id,sha256:g.mask_sha256||""})}`})):e.kind==="audit"?e.analysis.auxiliary_evidence.filter(g=>g.representation==="annotation_mask").map(g=>({id:g.evidence_id,bbox:g.crop_bbox,url:an(e.suggestionId,g)})):[],[s,d,u,h]=t||[0,0,r,a],p=(0,$t.useRef)(null),[x,v]=(0,$t.useState)(12);return(0,$t.useLayoutEffect)(()=>{let g=p.current,k=()=>{let c=Math.abs(g.getScreenCTM()?.a||0);c&&v(12/c)},f=new ResizeObserver(k);return f.observe(g),k(),()=>f.disconnect()},[s,d,u,h,i]),(0,Pe.jsxs)("svg",{ref:p,className:"iad-annotation-layer",viewBox:`${s} ${d} ${u-s} ${h-d}`,preserveAspectRatio:i==="contain"?"xMidYMid meet":"none","aria-label":"Labelme \u6807\u6CE8",children:[!!l.length&&(0,Pe.jsx)("g",{className:"iad-annotation-mask",children:l.map((g,k)=>{let f=`${n}-mask-${k}`,[c,m,y,S]=g.bbox;return(0,Pe.jsxs)("g",{children:[(0,Pe.jsx)("defs",{children:(0,Pe.jsx)("mask",{id:f,x:0,y:0,width:r,height:a,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse",style:{maskType:"luminance"},children:(0,Pe.jsx)(Ju,{href:g.url,x:c,y:m,width:y-c,height:S-m,preserveAspectRatio:"none",style:{imageRendering:"pixelated"}})})}),(0,Pe.jsx)("rect",{x:0,y:0,width:r,height:a,mask:`url(#${f})`})]},g.id)})}),o.map((g,k)=>(0,Pe.jsxs)("g",{children:[g.annotation_type!=="mask"&&(g.polygon?(0,Pe.jsx)("polygon",{points:g.polygon.map(f=>f.join(",")).join(" ")}):g.bbox&&(0,Pe.jsx)("rect",{x:g.bbox[0],y:g.bbox[1],width:g.bbox[2]-g.bbox[0],height:g.bbox[3]-g.bbox[1]})),g.bbox&&(0,Pe.jsx)("text",{style:{fontSize:x},x:g.bbox[0],y:Math.max(x,g.bbox[1]-4),children:g.raw_label})]},g.annotation_id||k))]})}var Of=I(N(),1);function fr({label:e}){return e?(0,Of.jsx)("span",{className:"iad-image-quality","data-quality":e,children:e}):null}var on=I(N(),1);function Mf({src:e,alt:t="",width:i,height:n,bboxes:r=[],annotationLayer:a,qualityLabel:o,showAnnotations:l=!0,className:s="",style:d,children:u,onLoadDimensions:h}){let[p,x]=(0,jf.useState)({width:i||0,height:n||0}),v=p.width||i||800,g=p.height||n||600;return(0,on.jsxs)("div",{className:`annotated-image-stage ${s}`,style:{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",...d},children:[(0,on.jsx)("img",{"data-media-label":"\u56FE\u50CF",src:e,alt:t,draggable:!1,style:{maxWidth:"100%",maxHeight:"100%",width:"100%",height:"100%",objectFit:"contain",display:"block",pointerEvents:"none",userSelect:"none"},onLoad:k=>{let f=k.currentTarget;f.naturalWidth&&f.naturalHeight&&(x({width:f.naturalWidth,height:f.naturalHeight}),h?.({naturalWidth:f.naturalWidth,naturalHeight:f.naturalHeight}))}}),l&&(a||r.length>0)&&(0,on.jsx)(ur,{fit:"contain",source:a||{kind:"boxes",annotations:r,width:v,height:g}}),u,(0,on.jsx)(fr,{label:o})]})}var Yt=I(N(),1),lo=(0,Df.forwardRef)(function({src:t,image:i,variant:n="thumbnail",label:r,children:a,mediaOverlay:o,className:l="",title:s=r,...d},u){return(0,Yt.jsxs)("button",{...d,"data-variant":n,ref:u,type:"button",className:`iad-thumbnail-card ${l}`,title:s,children:[(0,Yt.jsxs)("span",{className:"iad-thumbnail-media",children:[i?(0,Yt.jsx)(Mf,{src:i.src,alt:i.title,width:i.width,height:i.height,annotationLayer:i.annotationLayer,qualityLabel:i.qualityLabel}):t?(0,Yt.jsx)(Ji,{src:t,alt:r,loading:"lazy",decoding:"async"}):(0,Yt.jsx)("span",{children:"\u56FE\u50CF\u4E0D\u53EF\u7528"}),o]}),r&&(0,Yt.jsx)("span",{className:"iad-thumbnail-caption",children:r}),a]})});var Xt=I(N(),1),tv=24;function Ff({total:e,page:t,unit:i="\u6761",onPage:n,size:r=tv,label:a="",id:o,availablePages:l,hideSinglePage:s=!1}){if(!e||s&&e<=r)return null;let d=Math.max(1,Math.ceil(e/r)),u=Math.max(1,Math.min(t,d)),h=Math.max(1,Math.min(u-2,d-4));return(0,Xt.jsxs)("nav",{id:o,className:"iad-pagination","aria-label":`${a}\u5206\u9875`,children:[(0,Xt.jsx)("button",{type:"button",disabled:u<=1,onClick:()=>n(u-1),children:"\u4E0A\u4E00\u9875"}),Array.from({length:Math.min(d,5)},(p,x)=>h+x).map(p=>(0,Xt.jsx)("button",{type:"button","aria-label":`\u7B2C ${p} \u9875`,"aria-current":p===u?"page":void 0,"data-page":p,disabled:l!==void 0&&p>l,onClick:()=>n(p),children:p},p)),(0,Xt.jsx)("button",{type:"button",disabled:u>=d||l!==void 0&&u>=l,onClick:()=>n(u+1),children:"\u4E0B\u4E00\u9875"}),(0,Xt.jsxs)("span",{children:[u," / ",d," \u9875"]}),(0,Xt.jsxs)("span",{children:["\u5171 ",e," ",i]})]})}function Uf(e,t,i){return e==="folder_classification"?{annotationLayer:null,qualityLabel:t.quality_status==="PASS"?"OK":t.quality_status==="FAIL"?"NG":void 0}:e!=="labelme"?{}:{annotationLayer:{kind:"boxes",width:t.width,height:t.height,annotations:i.filter(n=>n.geometry_status!=="INVALID"&&(n.bbox||n.polygon))}}}var bi=I(U(),1);var ln=I(U(),1);var P=I(N(),1);function Bf(){return(0,P.jsx)("svg",{"aria-hidden":"true",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",children:(0,P.jsx)("path",{d:"m16 3 5 5L8 21H3v-5L16 3Z M13 6l5 5"})})}function Hf({size:e=16}={}){return(0,P.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,P.jsx)("path",{d:"M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"})})}function Vf(){return(0,P.jsxs)("svg",{"aria-hidden":"true",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinejoin:"round",children:[(0,P.jsx)("rect",{x:"8",y:"8",width:"12",height:"13",rx:"2"}),(0,P.jsx)("path",{d:"M16 8V3H3v13h5"})]})}function Qf(){return(0,P.jsx)("svg",{"aria-hidden":"true",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,P.jsx)("path",{d:"M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"})})}function Gf(){return(0,P.jsx)("svg",{"aria-hidden":"true",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:(0,P.jsx)("path",{d:"m6 6 12 12M18 6 6 18"})})}function Wf(){return(0,P.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,P.jsx)("path",{d:"M4 5h16l-6.5 7.5v4.3l-3.5 2v-6.3L4 5Z"}),(0,P.jsx)("path",{d:"m17 17 4 4m0-4-4 4"})]})}function qf(){return(0,P.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:[(0,P.jsx)("circle",{cx:"10",cy:"10",r:"7"}),(0,P.jsx)("path",{d:"m15 15 6 6M7 10h6M10 7v6"})]})}function Kf(){return(0,P.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:[(0,P.jsx)("circle",{cx:"10",cy:"10",r:"7"}),(0,P.jsx)("path",{d:"m15 15 6 6M7 10h6"})]})}function $f(){return(0,P.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,P.jsx)("circle",{cx:"12",cy:"12",r:"2.8"}),(0,P.jsx)("path",{d:"M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3"})]})}function Yf(){return(0,P.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,P.jsx)("path",{d:"M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"})})}function Xf(){return(0,P.jsxs)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,P.jsx)("path",{d:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"}),(0,P.jsx)("circle",{cx:"12",cy:"12",r:"3"}),(0,P.jsx)("path",{d:"m3 3 18 18"})]})}function Ys({size:e=16}){return(0,P.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:(0,P.jsx)("path",{d:"m6 9 6 6 6-6"})})}function Zf({size:e=16}){return(0,P.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:(0,P.jsx)("path",{d:"M12 5v14M5 12h14"})})}function Jf({size:e=18}){return(0,P.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,P.jsx)("path",{d:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"}),(0,P.jsx)("circle",{cx:"12",cy:"12",r:"3"})]})}function eg(){return(0,P.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,P.jsx)("path",{d:"M12 8v4l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"})})}function tg({size:e=17}){return(0,P.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,P.jsx)("path",{d:"M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10l-7-7Z"}),(0,P.jsx)("path",{d:"M13 3v7h7"}),(0,P.jsx)("circle",{cx:"11",cy:"15",r:"2.3"}),(0,P.jsx)("path",{d:"m12.8 16.8 2.3 2.3"})]})}function ig({size:e=18}){return(0,P.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,P.jsx)("path",{d:"M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"}),(0,P.jsx)("path",{d:"M14 3v5h5M9 12h6M9 16h6"})]})}function ng({size:e=20}){return(0,P.jsxs)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,P.jsx)("path",{d:"M12 6c-2.4-2-5.5-2.4-9-2v15c3.5-.5 6.5.2 9 2 2.5-1.8 5.5-2.5 9-2V4c-3.5-.4-6.6 0-9 2Z"}),(0,P.jsx)("path",{d:"M12 6v15"})]})}function rg({size:e=17}){return(0,P.jsx)("svg",{"aria-hidden":"true",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round",children:(0,P.jsx)("path",{d:"M18 20V10M12 20V4M6 20v-6"})})}var Xs=I(N(),1),gr=(0,ln.forwardRef)(function({className:t="",...i},n){return(0,Xs.jsx)("select",{...i,ref:n,className:`iad-select ${t}`})});var ag=I(U(),1);var Zs=I(N(),1),iv={close:Gf,delete:Qf,refresh:Hf,clear:Wf,edit:Bf,copy:Vf,add:Zf,chevron:Ys,prompt:ig,details:tg,clock:eg,mine:ng,stats:rg,annotations:Jf,annotationsOff:Xf,zoomIn:qf,zoomOut:Kf,fit:$f,expand:Yf},kt=(0,ag.forwardRef)(function({icon:t,label:i,title:n=i,type:r="button",className:a="",...o},l){let s=iv[t];return(0,Zs.jsx)("button",{...o,ref:l,type:r,"aria-label":i,title:n,"data-icon":t,className:`iad-icon-button ${a}`.trim(),children:(0,Zs.jsx)(s,{})})});var D=I(U(),1),sg=I(Ts(),1);var ot=I(U(),1),sn=I(N(),1);function og({id:e,title:t,onClose:i,children:n,className:r="",size:a="detail",frame:o="dialog",restoreFocus:l,initialFocus:s,header:d=!0,presentation:u="modal",onKeyDown:h}){let p=(0,ot.useRef)(null),x=(0,ot.useRef)(l),v=(0,ot.useRef)(!1),g=(0,ot.useRef)(null),k=(0,ot.useRef)(u);x.current=l,(0,ot.useLayoutEffect)(()=>{let c=p.current,m=document.activeElement,y=c.matches(":modal");if(g.current||(g.current=m),k.current=u,c.open&&c.close(),u==="inline"&&c.show(),u==="modal"&&(c.showModal(),s?.current?s.current.focus():m instanceof HTMLElement&&c.contains(m)&&m.focus()),u==="closed"&&(y||m&&c.contains(m))){let S=x.current?x.current():g.current;S instanceof HTMLElement&&S.isConnected&&S.focus()}},[u,s]),(0,ot.useEffect)(()=>{let c=p.current;return()=>{if(c.close(),k.current!=="modal")return;let m=x.current?x.current():g.current;m instanceof HTMLElement&&m.isConnected&&m.focus()}},[]);let f=c=>{let m=c.currentTarget.getBoundingClientRect();return c.target===c.currentTarget&&(c.clientX<m.left||c.clientX>m.right||c.clientY<m.top||c.clientY>m.bottom)};return(0,sn.jsxs)("dialog",{id:e,ref:p,onClick:c=>{u==="modal"&&c.stopPropagation()},onKeyDown:c=>{u==="modal"&&c.stopPropagation(),h?.(c)},"aria-label":t,role:u==="inline"?"region":void 0,className:`${o==="fullscreen"?"iad-fullscreen-dialog":"iad-detail-dialog"} ${a!=="detail"?`iad-dialog-${a}`:""} ${u==="inline"?"iad-inline-dialog":""} ${r}`,onCancel:c=>{c.preventDefault(),c.stopPropagation(),i()},onPointerDown:c=>{v.current=f(c)},onPointerUp:c=>{v.current&&f(c)&&i(),v.current=!1},children:[d&&u==="modal"&&(0,sn.jsxs)("header",{className:"iad-dialog-header",children:[(0,sn.jsx)("h2",{children:t}),(0,sn.jsx)(kt,{icon:"close",type:"button",label:`\u5173\u95ED${t}`,title:"\u5173\u95ED",onClick:i})]}),n]})}var so=I(U(),1);var V0=new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});function lg(e,t=0,i=!1){let n=Ws({queryKey:["iad","resource",e],enabled:!!e,queryFn:({signal:a})=>Ks(e,void 0,void 0,a),refetchInterval:i?1200:!1,refetchOnWindowFocus:i},cr),r=(0,so.useRef)({path:e,revision:t});return(0,so.useEffect)(()=>{r.current.path===e&&r.current.revision!==t&&e&&cr.invalidateQueries({queryKey:["iad","resource",e],exact:!0},{cancelRefetch:!1}),r.current={path:e,revision:t}},[e,t]),{data:e?n.data??null:null,error:e&&n.error?ao(n.error):"",loading:!!e&&n.isPending,refreshing:!!e&&n.isFetching}}var O=I(N(),1);function dg({open:e,item:t,items:i=[],currentIndex:n=-1,onClose:r,onNavigate:a,navigation:o,context:l,overlay:s,initialTransform:d,onTransform:u,onImageClick:h}){let p=lg(e&&t?.sampleId&&t.annotationLayer===void 0&&!t.qualityLabel?`/sample/${encodeURIComponent(t.sampleId)}`:null),x=t?.annotationLayer===null?void 0:t?.annotationLayer||(p.data?{kind:"sample",sample:p.data.sample,annotations:p.data.annotations}:t?.bboxes?.length?{kind:"boxes",annotations:t.bboxes,width:t.width||1,height:t.height||1}:void 0),[v,g]=(0,D.useState)("fit"),[k,f]=(0,D.useState)(1),[c,m]=(0,D.useState)(0),[y,S]=(0,D.useState)(0),[E,R]=(0,D.useState)(!0),[L,J]=(0,D.useState)({width:0,height:0}),[T,Ue]=(0,D.useState)({width:0,height:0}),[co,rd]=(0,D.useState)(!1),pt=(0,D.useRef)(null),br=(0,D.useRef)(null),nm=(0,D.useRef)(null),rm=(0,D.useRef)(null),uo=(0,D.useRef)(!1),cn=L.width||t?.width||800,un=L.height||t?.height||600,It=(0,D.useMemo)(()=>{if(T.width<=0||T.height<=0||cn<=0||un<=0)return 1;let z=Math.max(100,T.width-128),K=Math.max(100,T.height-40),Ye=z/cn,ki=K/un;return Math.max(.05,Math.min(Ye,ki))},[T.width,T.height,cn,un]),ti=v==="fit"?It:k*It;(0,D.useEffect)(()=>{u?.({zoom:v==="fit"?0:k,x:c,y})},[v,k,c,y,u]),(0,D.useLayoutEffect)(()=>{J({width:0,height:0})},[t?.imageUrl]);let fo=(0,D.useCallback)(z=>{g("custom"),f(Math.max(.1,Math.min(10,z))/It)},[It]),ad=(0,D.useCallback)(()=>{g("fit"),m(0),S(0)},[]);(0,D.useLayoutEffect)(()=>{let z=br.current;if(!z||!e)return;let K=new ResizeObserver(([Ye])=>{Ue({width:Ye.contentRect.width,height:Ye.contentRect.height})});return K.observe(z),Ue({width:z.clientWidth,height:z.clientHeight}),()=>K.disconnect()},[e]);let am=(0,D.useCallback)(z=>{z.target.closest("button")||z.target.closest("select")||(pt.current={x:z.clientX,y:z.clientY,panX:c,panY:y},uo.current=!1,rd(!0),z.currentTarget.setPointerCapture(z.pointerId))},[c,y]),om=(0,D.useCallback)(z=>{pt.current&&(Math.abs(z.clientX-pt.current.x)+Math.abs(z.clientY-pt.current.y)>4&&(uo.current=!0),m(pt.current.panX+z.clientX-pt.current.x),S(pt.current.panY+z.clientY-pt.current.y))},[]),od=(0,D.useCallback)(()=>{pt.current=null,rd(!1)},[]);(0,D.useEffect)(()=>{let z=br.current;if(!z||!e)return;function K(Ye){Ye.preventDefault(),g("custom"),f(ki=>{let go=v==="fit"?It:ki*It;return Math.max(.1,Math.min(10,go*(Ye.deltaY<0?1.15:1/1.15)))/It})}return z.addEventListener("wheel",K,{passive:!1}),()=>z.removeEventListener("wheel",K)},[e,v,It]);let wr=(0,D.useCallback)(z=>{if(br.current?.focus({preventScroll:!0}),o){!o.busy&&(z<0?o.previous:o.next)&&o.move(z<0?-1:1);return}if(n<0||!i.length||!a)return;let K=Math.max(0,Math.min(i.length-1,n+z));a(K),m(0),S(0),g("fit")},[n,i.length,a,o]);if((0,D.useEffect)(()=>{e&&t&&(m(d?.x||0),S(d?.y||0),g(d?.zoom?"custom":"fit"),d?.zoom&&f(d.zoom),R(!0))},[e,t?.id]),!e||!t)return null;let lm=!!(x&&(x.kind!=="audit"?x.annotations.length:x.analysis.auxiliary_evidence.length)),ld=t.title.split("/").pop()||t.title,sm=(0,O.jsx)("div",{id:"full-overlay",className:"full-overlay",role:"presentation",children:(0,O.jsxs)("section",{className:"full-dialog",children:[(0,O.jsxs)("header",{className:"full-toolbar",role:"toolbar","aria-label":"\u56FE\u50CF\u67E5\u770B\u5DE5\u5177",children:[(0,O.jsx)("div",{className:"full-file",id:"full-file-name",title:t.title,style:{color:"#f4f7fd"},children:ld}),(0,O.jsx)(fr,{label:t.qualityLabel}),(0,O.jsxs)("div",{className:"full-actions",children:[(0,O.jsx)(kt,{icon:"zoomOut",type:"button",id:"zoom-out",title:"\u7F29\u5C0F",label:"\u7F29\u5C0F",onClick:()=>fo(ti/1.25)}),(0,O.jsxs)("span",{className:"zoom-wrap",style:{background:"rgba(255, 255, 255, 0.12)",border:"1px solid rgba(255, 255, 255, 0.22)"},children:[(0,O.jsxs)(gr,{id:"zoom",title:"\u7F29\u653E\u6BD4\u4F8B","aria-label":"\u7F29\u653E\u6BD4\u4F8B",style:{color:"#f4f7fd",background:"transparent"},value:v==="fit"?"fit":[.5,1,1.5,2].some(z=>Math.abs(ti-z)<.001)?String(ti):"custom",onChange:z=>{let K=z.target.value;K==="fit"?ad():K!=="custom"&&fo(Number(K))},children:[(0,O.jsx)("option",{value:"fit",children:"\u9002\u5E94\u7A97\u53E3"}),(0,O.jsx)("option",{value:"0.5",children:"50%"}),(0,O.jsx)("option",{value:"1",children:"100%"}),(0,O.jsx)("option",{value:"1.5",children:"150%"}),(0,O.jsx)("option",{value:"2",children:"200%"}),(0,O.jsx)("option",{value:"custom",children:v==="fit"||[.5,1,1.5,2].some(z=>Math.abs(ti-z)<.001)?"\u81EA\u5B9A\u4E49":`${Math.round(ti*100)}%`})]}),(0,O.jsx)("span",{className:"zoom-chevron","aria-hidden":"true",children:(0,O.jsx)("svg",{viewBox:"0 0 24 24",children:(0,O.jsx)("path",{d:"m6 9 6 6 6-6"})})})]}),(0,O.jsx)(kt,{icon:"zoomIn",type:"button",id:"zoom-in",title:"\u653E\u5927",label:"\u653E\u5927",onClick:()=>fo(ti*1.25)}),(0,O.jsx)(kt,{icon:"fit",type:"button",id:"fit",title:"\u9002\u5E94\u7A97\u53E3",label:"\u9002\u5E94\u7A97\u53E3",onClick:ad}),(0,O.jsx)(kt,{icon:E?"annotations":"annotationsOff",type:"button",id:"annotation-toggle",title:E?"\u9690\u85CF\u6807\u6CE8":"\u67E5\u770B\u6807\u6CE8",label:E?"\u9690\u85CF\u6807\u6CE8":"\u67E5\u770B\u6807\u6CE8","aria-pressed":E,disabled:!lm,onClick:()=>R(z=>!z)}),(0,O.jsx)(kt,{icon:"close",type:"button",className:"full-close",id:"full-close",title:"\u5173\u95ED",label:"\u5173\u95ED",onClick:r})]})]}),(0,O.jsxs)("div",{className:"full-content",children:[(0,O.jsxs)("div",{className:`full-stage ${co?"dragging":""}`,id:"stage",tabIndex:0,ref:br,"aria-label":"\u5927\u56FE\u67E5\u770B\u533A\u57DF",onPointerDown:am,onPointerMove:om,onPointerUp:od,onPointerCancel:od,children:[(0,O.jsxs)("div",{id:"image-world",ref:rm,className:"full-image-world",onClick:z=>{if(!h||uo.current)return;let K=z.currentTarget.getBoundingClientRect(),[Ye,ki,go,dm]=t.evidence?.crop_bbox||(x?.kind==="sample"?[0,0,x.sample.width,x.sample.height]:[0,0,t.width||cn,t.height||un]);h([Ye+(z.clientX-K.left)/K.width*(go-Ye),ki+(z.clientY-K.top)/K.height*(dm-ki)])},style:{position:"absolute",left:"50%",top:"50%",width:`${cn}px`,height:`${un}px`,transformOrigin:"center",transform:`translate(-50%, -50%) translate(${c}px, ${y}px) scale(${ti})`},children:[(0,O.jsx)("img",{id:"big-image",ref:nm,src:t.imageUrl,alt:ld,draggable:!1,style:{width:"100%",height:"100%",display:"block",objectFit:"contain",pointerEvents:"none",userSelect:"none"},onLoad:z=>{let K=z.currentTarget;K.naturalWidth&&K.naturalHeight&&J({width:K.naturalWidth,height:K.naturalHeight})}}),E&&x&&(0,O.jsx)(ur,{source:x,viewport:t.evidence?.crop_bbox}),s]}),(o||i.length>1&&a)&&(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)("button",{type:"button",className:"full-side-nav prev",id:"prev-img","aria-label":"\u4E0A\u4E00\u5F20\u56FE\u50CF",title:"\u4E0A\u4E00\u5F20\u56FE\u50CF",disabled:o?!o.previous||o.busy:n<=0,onClick:z=>{z.stopPropagation(),wr(-1)},children:"\u2039"}),(0,O.jsx)("button",{type:"button",className:"full-side-nav next",id:"next-img","aria-label":"\u4E0B\u4E00\u5F20\u56FE\u50CF",title:"\u4E0B\u4E00\u5F20\u56FE\u50CF",disabled:o?!o.next||o.busy:n>=i.length-1,onClick:z=>{z.stopPropagation(),wr(1)},children:"\u203A"})]})]}),l&&(0,O.jsx)("aside",{className:"full-context",children:l})]})]})}),sd=(0,O.jsx)(og,{title:"\u539F\u56FE\u68C0\u89C6\u5668",frame:"fullscreen",header:!1,onClose:r,onKeyDown:z=>{if(z.key==="Escape"){z.preventDefault(),r();return}z.target.closest("input,textarea,select")||(z.key==="PageUp"||z.key==="ArrowLeft"?(z.preventDefault(),wr(-1)):(z.key==="PageDown"||z.key==="ArrowRight")&&(z.preventDefault(),wr(1)))},children:sm});return typeof document>"u"?sd:(0,sg.createPortal)(sd,document.body)}var po=I(N(),1);function Js({analysis:e,ids:t,label:i,onEvidence:n,selectedId:r}){let a=oo(e);return(0,po.jsx)("div",{className:"iad-actions",children:t.map((o,l)=>{let s=a.get(o);return(0,po.jsxs)("button",{"data-evidence-id":o,"aria-current":o===r?"true":void 0,disabled:!s,onClick:()=>s&&n(s),"aria-label":`\u67E5\u770B${i}\u7684\u8BC1\u636E ${l+1}`,children:["\u8BC1\u636E ",l+1,"\uFF0C",s?s.representation==="annotation_mask"?"\u5B9A\u4F4D\u56FE":s.role==="overview"?"\u5168\u56FE":"ROI":"\u4E0D\u53EF\u7528"]},o)})})}var rv=I(U(),1);var Zt=I(N(),1);function pg({finding:e}){return(0,Zt.jsxs)(Zt.Fragment,{children:[(0,Zt.jsxs)("p",{children:["\u5F02\u5E38\u5047\u8BBE\uFF1A",e.hypothesis]}),(0,Zt.jsxs)("p",{children:["\u6B63\u5E38\u89E3\u91CA\uFF1A",e.normal_explanation]}),!!e.limitations.length&&(0,Zt.jsx)("p",{className:"iad-muted",children:e.limitations.join("\uFF1B")})]})}var cg=I(U(),1),fg=I(N(),1),ug=(0,cg.forwardRef)(function({variant:t="secondary",type:i="button",className:n="",...r},a){return(0,fg.jsx)("button",{...r,ref:a,type:i,"data-variant":t,className:["iad-button",n].filter(Boolean).join(" ")})});var hr=I(U(),1);var dn=I(U(),1);function yi(e,t){let i=t?.kind==="finding"?t.id:t?.findingId,n=e?.findings.find(o=>o.finding_id===i),r=e&&t?.kind==="evidence"?oo(e).get(t.id):void 0,a=e?.regions.find(o=>t?.kind==="evidence"?o.image.evidence_id===t.id:n?.location.scope==="local"&&n.evidence_ids.includes(o.image.evidence_id));return{finding:n,evidence:r,region:a}}var av={"industrial-datasets":{label:"\u6570\u636E\u96C6\u7BA1\u7406",chapter:"\u6570\u636E\u51C6\u5907"},"industrial-images":{label:"\u56FE\u50CF\u6D4F\u89C8",chapter:"\u6570\u636E\u51C6\u5907"},"industrial-exploration":{label:"\u65B9\u5411\u63A2\u7D22",chapter:"\u77E5\u8BC6\u6784\u5EFA"},"industrial-knowledge":{label:"\u77E5\u8BC6\u6316\u6398",chapter:"\u77E5\u8BC6\u6784\u5EFA"},"industrial-consistency":{label:"\u6570\u636E\u4E00\u81F4\u6027",chapter:"\u8D28\u91CF\u5BA1\u6838"},"industrial-audit":{label:"\u6A21\u578B\u5BA1\u8BA1",chapter:"\u8D28\u91CF\u5BA1\u6838"},"industrial-review":{label:"\u4EBA\u5DE5\u590D\u6838",chapter:"\u8D28\u91CF\u5BA1\u6838"},"industrial-model-settings":{label:"\u6A21\u578B\u8BBE\u7F6E",chapter:"\u5DE5\u5177"}},gg=Object.fromEntries(Object.entries(av).map(([e,t])=>[e,t.label]));var ed={supported:"\u6709\u8BC1\u636E\u652F\u6301",provisional:"\u5F85\u9A8C\u8BC1",conflicted:"\u5B58\u5728\u77DB\u76FE"};var ov=(0,dn.createContext)(null);function mr(){let e=(0,dn.useContext)(ov);if(!e)throw new Error("Workbench requires its workspace owner");let t=(0,dn.useSyncExternalStore)(e.subscribe,e.getSnapshot);return{workspace:e,state:t}}var $e=I(N(),1);function mg({inspection:e,selection:t,transform:i}){let{workspace:n}=mr(),[r,a]=(0,hr.useState)(!1),[o,l]=(0,hr.useState)(""),[s,d]=(0,hr.useState)(!1),[u,h]=(0,hr.useState)("");async function p(x){x.preventDefault(),d(!0),h("");let{finding:v,evidence:g}=yi(e.analysis,t);try{await n.ask({...e.reference,finding_id:v?.finding_id||null,evidence_id:g?.evidence_id||null},t,i(),o.trim())}catch(k){h(ao(k))}finally{d(!1)}}return r?(0,$e.jsxs)("form",{className:"iad-inspection-question",onSubmit:p,"aria-label":"\u5411 Agent \u8FFD\u95EE",children:[(0,$e.jsxs)("label",{className:"iad-field",children:["\u8FFD\u95EE\u5185\u5BB9",(0,$e.jsx)("textarea",{"aria-label":"\u8FFD\u95EE\u5185\u5BB9",rows:3,value:o,disabled:s,onChange:x=>l(x.target.value)})]}),(0,$e.jsx)("p",{className:"iad-muted",children:"\u643A\u5E26\u5F53\u524D\u7591\u70B9\u3001\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u5B9E\u9645\u56FE\u50CF\u5F15\u7528\u3002"}),u&&(0,$e.jsx)("p",{role:"alert",className:"iad-error",children:u}),(0,$e.jsxs)("div",{className:"iad-actions",children:[(0,$e.jsx)(ug,{type:"submit",variant:"primary",disabled:s,children:s?"\u6B63\u5728\u63D0\u4EA4\u2026":"\u53D1\u9001\u5230\u4F1A\u8BDD"}),(0,$e.jsx)("button",{type:"button",disabled:s,onClick:()=>a(!1),children:"\u53D6\u6D88"})]})]}):(0,$e.jsx)("button",{onClick:()=>a(!0),children:"\u5411 Agent \u8FFD\u95EE"})}var C=I(N(),1);function td({inspection:e,selectedId:t,hoveredIds:i,regions:n,finding:r}){let{analysis:a}=e;return(0,C.jsxs)(C.Fragment,{children:[(0,C.jsx)("svg",{className:"iad-roi-layer",viewBox:`0 0 ${a.overview.original_size.join(" ")}`,preserveAspectRatio:"none","aria-label":"\u5BA1\u8BA1\u533A\u57DF",children:n.map(o=>{let[l,s,d,u]=o.crop_bbox;return(0,C.jsx)("g",{"data-evidence-id":o.image.evidence_id,"data-locked":t===o.image.evidence_id,className:i.includes(o.image.evidence_id)?"is-hovered":"",children:(0,C.jsx)("rect",{x:l,y:s,width:d-l,height:u-s})},o.image.evidence_id)})}),r?.location.scope==="local"&&(0,C.jsx)("svg",{className:"iad-finding-layer","data-finding-id":r.finding_id,viewBox:`0 0 ${a.overview.original_size.join(" ")}`,preserveAspectRatio:"none","aria-label":r.location.description,children:(0,C.jsx)("rect",{x:r.location.bbox[0],y:r.location.bbox[1],width:r.location.bbox[2]-r.location.bbox[0],height:r.location.bbox[3]-r.location.bbox[1]})})]})}function id({inspection:e,selection:t,onSelect:i,choices:n,transform:r}){let{analysis:a,reference:o}=e,{workspace:l,state:s}=mr(),d=o.suggestion_id,{finding:u,evidence:h,region:p}=yi(a,t),x=p?.image.evidence_id||"",v=p?a.findings.filter(g=>g.evidence_ids.includes(p.image.evidence_id)):[];return(0,C.jsxs)("aside",{className:"iad-inspection-panel","aria-label":"\u5168\u56FE\u4E0E ROI \u7EFC\u5408\u5206\u6790",children:[e.historical&&(0,C.jsx)("p",{role:"status",children:"\u5386\u53F2\u5EFA\u8BAE\uFF0C\u4FDD\u7559\u8BE5\u6B21\u51BB\u7ED3\u77E5\u8BC6\u4E0E\u56FE\u50CF\u8BC1\u636E\u3002"}),(0,C.jsx)(mg,{inspection:e,selection:t,transform:r}),!!a.consistency?.results.length&&(0,C.jsxs)("section",{"aria-label":"\u51BB\u7ED3\u4E00\u81F4\u6027\u8BC1\u636E",children:[(0,C.jsx)("h3",{children:"\u6570\u636E\u4E00\u81F4\u6027\u8BC1\u636E"}),a.consistency.results.map(g=>(0,C.jsx)("button",{onClick:()=>l.openLocation({pageId:"industrial-consistency",tab:"search",query:{kind:"sample",sample_id:o.sample_id},evidenceId:g.evidence_id,resultId:g.result_id,returnPage:s.pageId==="industrial-consistency"?void 0:s.pageId}),children:"\u67E5\u770B\u6BD4\u8F83\u8BC1\u636E"},g.result_id))]}),(0,C.jsx)("h2",{children:"\u7EFC\u5408\u5EFA\u8BAE"}),(0,C.jsx)("p",{children:a.conclusion.description}),(0,C.jsxs)("p",{className:"iad-muted",children:["\u4F4D\u7F6E\uFF1A",a.conclusion.position_analysis,(0,C.jsx)("br",{}),"\u5149\u7167\uFF1A",a.conclusion.illumination_analysis]}),!!a.findings.length&&(0,C.jsxs)("label",{className:"iad-field",children:["\u5BA1\u8BA1\u7591\u70B9",(0,C.jsxs)(gr,{"aria-label":"\u5BA1\u8BA1\u7591\u70B9",value:u?.finding_id||"",onChange:g=>i(g.target.value?{kind:"finding",id:g.target.value}:null),children:[(0,C.jsx)("option",{value:"",children:"\u9009\u62E9\u7591\u70B9"}),a.findings.map(g=>(0,C.jsxs)("option",{value:g.finding_id,children:[g.location.scope==="global"?"\u5168\u56FE":"\u5C40\u90E8","\uFF0C",g.location.description,"\uFF0C",g.description]},g.finding_id))]})]}),u&&(0,C.jsxs)("section",{className:"iad-inspection-finding","data-finding-id":u.finding_id,children:[(0,C.jsxs)("h3",{children:[u.location.scope==="global"?"\u5168\u56FE\u5173\u7CFB":"\u5C40\u90E8\u7591\u70B9","\uFF0C",u.location.description]}),(0,C.jsx)("p",{children:u.description}),(0,C.jsx)(pg,{finding:u}),(0,C.jsx)("p",{children:u.review_action}),(0,C.jsx)(Js,{analysis:a,ids:u.evidence_ids,label:u.description,selectedId:h?.evidence_id||p?.image.evidence_id,onEvidence:g=>i({kind:"evidence",id:g.evidence_id,findingId:u.finding_id})})]}),!!n.length&&(0,C.jsxs)("div",{role:"group","aria-label":"\u91CD\u53E0\u533A\u57DF",children:[(0,C.jsx)("h3",{children:"\u9009\u62E9\u91CD\u53E0\u533A\u57DF"}),a.regions.filter(g=>n.includes(g.image.evidence_id)).map(g=>(0,C.jsxs)("button",{onClick:()=>i({kind:"evidence",id:g.image.evidence_id}),children:[g.label,"\uFF0C",g.crop_bbox.join(", ")]},g.image.evidence_id))]}),(0,C.jsx)("div",{className:"iad-roi-list","aria-label":"\u5BA1\u8BA1 ROI",children:a.regions.map((g,k)=>(0,C.jsxs)("button",{"aria-label":`\u5B9A\u4F4D ROI ${k+1}`,"aria-pressed":x===g.image.evidence_id,onClick:()=>i({kind:"evidence",id:g.image.evidence_id}),children:["ROI ",k+1,"\uFF0C",g.label]},g.image.evidence_id))}),p?(0,C.jsxs)("section",{className:"iad-inspection-region","data-evidence-id":p.image.evidence_id,children:[(0,C.jsxs)("h3",{children:[$s[p.source],"\uFF0C",p.label]}),(0,C.jsx)(Wa,{children:(0,C.jsx)(Ji,{src:an(d,p.image),alt:"\u6240\u9009 ROI \u7684\u5B9E\u9645\u9001\u6A21\u88C1\u56FE","data-media-label":"ROI \u88C1\u56FE"})},p.image.evidence_id),(0,C.jsxs)("dl",{children:[(0,C.jsx)("dt",{children:"\u539F\u56FE\u533A\u57DF"}),(0,C.jsx)("dd",{children:p.bbox.join(", ")}),(0,C.jsx)("dt",{children:"\u5916\u6269\u88C1\u56FE"}),(0,C.jsx)("dd",{children:p.crop_bbox.join(", ")})]}),(0,C.jsx)("p",{children:p.observation.description}),(0,C.jsxs)("p",{children:["\u4F4D\u7F6E\uFF1A",p.observation.position_analysis]}),(0,C.jsxs)("p",{children:["\u5149\u7167\uFF1A",p.observation.illumination_analysis]}),!u&&!!v.length&&(0,C.jsx)("div",{className:"iad-related-findings iad-actions","aria-label":"ROI \u5173\u8054\u7591\u70B9",children:v.map(g=>(0,C.jsxs)("button",{"data-finding-id":g.finding_id,onClick:()=>i({kind:"finding",id:g.finding_id}),children:[g.location.description,"\uFF0C",g.description]},g.finding_id))})]}):!h&&!u&&(0,C.jsx)("p",{className:"iad-muted",children:"\u70B9\u9009\u56FE\u4E2D\u533A\u57DF\u6216 ROI \u6309\u94AE\u67E5\u770B\u5B9E\u9645\u88C1\u56FE\u3002"}),h&&h.representation!=="raw"&&(0,C.jsxs)("section",{className:"iad-inspection-mask","data-evidence-id":h.evidence_id,children:[(0,C.jsx)("h3",{children:h.representation==="annotation_mask"?"\u6807\u6CE8\u5B9A\u4F4D\u56FE":"\u6807\u6CE8\u53E0\u52A0\u56FE"}),(0,C.jsx)(Wa,{children:(0,C.jsx)(Ji,{src:an(d,h),alt:"\u6240\u9009\u6807\u6CE8\u7684\u5B9E\u9645\u9001\u6A21\u56FE","data-media-label":"\u6807\u6CE8\u8BC1\u636E"})},h.evidence_id),(0,C.jsxs)("p",{children:["\u539F\u56FE\u5750\u6807\uFF1A",h.crop_bbox.join(", ")]})]}),h?.role==="overview"&&(0,C.jsxs)("section",{className:"iad-inspection-overview","data-evidence-id":h.evidence_id,children:[(0,C.jsx)("h3",{children:"\u5168\u56FE\u89C2\u5BDF"}),(0,C.jsx)("p",{children:a.global_view.description}),(0,C.jsxs)("p",{children:["\u4F4D\u7F6E\uFF1A",a.global_view.position_analysis]}),(0,C.jsxs)("p",{children:["\u5149\u7167\uFF1A",a.global_view.illumination_analysis]})]}),(0,C.jsxs)("details",{children:[(0,C.jsx)("summary",{children:"\u7248\u672C\u4E0E\u8BC1\u636E\u8303\u56F4"}),(0,C.jsx)("p",{children:(0,C.jsx)("code",{children:a.normal_version_id})}),(0,C.jsxs)("p",{children:["\u5B9E\u9645\u7EC6\u770B ",a.coverage.inspected_regions," / ",a.coverage.planned_regions," \u4E2A ROI"]}),a.coverage.missing.map((g,k)=>(0,C.jsx)("p",{children:g},k))]})]})}var xr=I(U(),1);var hg=I(U(),1);var xg=I(N(),1);var vg=I(N(),1);var lt=I(N(),1);function yg({image:e,onClose:t,navigation:i,collection:n}){let[r,a]=(0,bi.useState)(n?.index||0),[o,l]=(0,bi.useState)(e.initialSelection||null),s=(0,bi.useRef)(e.initialTransform||{zoom:0,x:0,y:0}),d=(0,bi.useCallback)(k=>{s.current=k},[]),u=n?.images[r]?.image||e,h=u.inspection,{finding:p,region:x}=yi(h?.analysis,o),v=n?(0,lt.jsxs)("div",{children:[(0,lt.jsx)("h3",{children:n.title}),(0,lt.jsx)("p",{children:n.instruction}),(0,lt.jsx)("div",{className:"iad-thumbnail-grid",children:n.images.map((k,f)=>(0,lt.jsx)(lo,{src:k.image.src,label:k.label,"aria-current":f===r,onClick:()=>a(f)},k.id))})]}):h?(0,lt.jsx)(id,{inspection:h,selection:o,choices:[],onSelect:l,transform:()=>s.current}):void 0,g=n?.images.map(k=>({id:k.id,title:k.image.title,imageUrl:k.image.src,width:k.image.width,height:k.image.height,annotationLayer:k.image.annotationLayer,qualityLabel:k.image.qualityLabel,sampleId:k.image.sampleId,evidence:k.image.evidence}));return(0,lt.jsx)(dg,{open:!0,item:{id:u.src,title:u.title,imageUrl:u.src,width:u.width,height:u.height,annotationLayer:u.annotationLayer,qualityLabel:u.qualityLabel,sampleId:u.sampleId,evidence:u.evidence},items:g,currentIndex:r,onNavigate:n?a:void 0,navigation:i,context:v,initialTransform:u.initialTransform,onTransform:d,onClose:t,overlay:h&&(0,lt.jsx)(td,{inspection:h,selectedId:x?.image.evidence_id||"",hoveredIds:[],regions:h.analysis.regions,finding:p}),onImageClick:h?k=>{let f=h.analysis.regions.find(c=>k[0]>=c.crop_bbox[0]&&k[0]<=c.crop_bbox[2]&&k[1]>=c.crop_bbox[1]&&k[1]<=c.crop_bbox[3]);f&&l({kind:"evidence",id:f.image.evidence_id})}:void 0})}var bg=I(U(),1),kg=I(N(),1),Sg=I(U(),1);function wg({label:e,items:t,value:i,onChange:n,className:r=""}){let a=(0,bg.useRef)(new Map);function o(l,s){let d=l.key==="Home"?0:l.key==="End"?t.length-1:l.key==="ArrowRight"?(s+1)%t.length:l.key==="ArrowLeft"?(s+t.length-1)%t.length:null;d!==null&&(l.preventDefault(),n(t[d].id),a.current.get(t[d].id)?.focus({preventScroll:!0}))}return(0,kg.jsx)("div",{className:`iad-tabs ${r}`.trim(),role:"tablist","aria-label":e,children:t.map((l,s)=>(0,Sg.createElement)("button",{...l.buttonProps,key:l.id,type:"button",role:"tab","aria-selected":i===l.id,tabIndex:i===l.id?0:-1,className:i===l.id?"active":"",ref:d=>{d?a.current.set(l.id,d):a.current.delete(l.id)},onKeyDown:d=>o(d,s),onClick:()=>n(l.id)},l.label))})}var Ig=I(N(),1);function ie({level:e,number:t,children:i}){let n=`h${e}`;return(0,Ig.jsxs)(n,{children:[t&&t+" ",i]})}var St=I(N(),1);function st({items:e,imageUrl:t,title:i="\u56FE\u50CF\u8BC1\u636E",heading:n={level:4}}){let r=(0,Jt.useRef)(null),[a,o]=(0,Jt.useState)({page:1,size:8}),[l,s]=(0,Jt.useState)(null),[d,u]=(0,Jt.useState)("representative"),h=e.some(g=>g.role==="counter")&&e.some(g=>g.role==="representative"),p=h?e.filter(g=>g.role===d):e,x=Math.min(a.page,Math.max(1,Math.ceil(p.length/a.size)));if((0,Jt.useLayoutEffect)(()=>{if(!e.length)return;let g=r.current,k=new ResizeObserver(()=>{if(!g.getBoundingClientRect().width)return;let f=getComputedStyle(g).gridTemplateColumns.split(" ").length*2;o(c=>c.size===f?c:{page:1,size:f})});return k.observe(g),()=>k.disconnect()},[p.length]),!e.length)return null;let v=p.map(g=>({src:t(g),title:g.source.sample.relative_path.split("/").pop(),width:g.image.original_size[0],height:g.image.original_size[1],sampleId:g.sample_id,evidence:g.image,...Uf(g.source.dataset_format,g.source.sample,g.source.annotations)}));return(0,St.jsxs)("section",{className:"iad-audit-gallery","aria-label":i,children:[(0,St.jsx)(ie,{...n,children:i}),h&&(0,St.jsx)(wg,{label:i+"\u5BF9\u7167",value:d,onChange:g=>{u(g),o(k=>({...k,page:1})),s(null)},items:[{id:"representative",label:"\u5F53\u524D\u56FE\u7EC4"},{id:"counter",label:"\u5BF9\u7167\u56FE\u7EC4"}]}),(0,St.jsx)("div",{ref:r,className:"iad-thumbnail-grid",children:v.slice((x-1)*a.size,x*a.size).map((g,k)=>{let f=(x-1)*a.size+k;return(0,St.jsx)(lo,{image:g,label:"",title:p[f].reason,"data-audit-evidence-role":p[f].role,"aria-label":`\u653E\u5927${p[f].reason}`,onClick:()=>s(f)},p[f].image.evidence_id)})}),(0,St.jsx)(Ff,{total:p.length,page:x,size:a.size,unit:"\u5F20",label:i,hideSinglePage:!0,onPage:g=>o(k=>({...k,page:g}))}),l!==null&&(0,St.jsx)(yg,{image:v[l],onClose:()=>s(null),navigation:p.length>1?{previous:l>0,next:l<p.length-1,busy:!1,error:"",move:g=>s(l+g)}:void 0})]})}var dt=I(N(),1);function wi({kind:e,title:t,rows:i,unit:n,maximum:r=Math.max(1,...i.map(a=>a.value))}){let a={gridTemplateColumns:`repeat(${i.length},minmax(0,1fr))`};return(0,dt.jsxs)("figure",{className:"iad-audit-chart","data-chart":e,children:[(0,dt.jsx)("figcaption",{children:t}),(0,dt.jsx)("div",{className:"iad-audit-chart-bars",style:a,role:"img","aria-label":i.map(o=>`${o.label} ${o.value} ${n}`).join("\uFF1B"),children:i.map(o=>(0,dt.jsxs)("div",{className:"iad-audit-chart-column",children:[(0,dt.jsx)("span",{className:"iad-audit-chart-value",children:o.value.toLocaleString("zh-CN")}),(0,dt.jsx)("span",{className:"iad-audit-chart-bar",style:{height:`${o.value/r*85}%`}})]},o.label))}),(0,dt.jsx)("div",{className:"iad-audit-chart-labels",style:a,"aria-hidden":"true",children:i.map(o=>(0,dt.jsx)("span",{children:o.label},o.label))})]})}var Eg=I(N(),1);function vr(e,t){let i=new Map;for(let n of t)for(let r of e.evidence_groups["case:"+n]||[])i.has(r.image.evidence_id)||i.set(r.image.evidence_id,r);return[...i.values()].slice(0,8)}function nd({ids:e,report:t,imageUrl:i,heading:n}){return(0,Eg.jsx)(st,{items:vr(t,e),imageUrl:i,heading:n})}var Le=I(N(),1);function pn({content:e,imageUrl:t}){let i=e.galleries.filter(n=>n.images.length);return(0,Le.jsxs)(Le.Fragment,{children:[(0,Le.jsx)(ie,{level:3,number:e.number,children:e.title}),e.description&&(0,Le.jsx)("p",{children:e.description}),e.facts?.map(n=>(0,Le.jsxs)("p",{children:[(0,Le.jsxs)("strong",{children:[n.label,"\uFF1A"]}),n.text]},n.label)),i.map((n,r)=>(0,Le.jsx)(st,{title:n.title,items:n.images,imageUrl:t,heading:{level:4,number:e.number+"."+(r+1)}},n.title)),e.analysis.filter(n=>n.text).map((n,r)=>(0,Le.jsxs)("section",{children:[(0,Le.jsx)(ie,{level:4,number:e.number+"."+(i.length+r+1),children:n.title}),(0,Le.jsx)("p",{children:n.text})]},n.title))]})}var M=I(N(),1);function _g({report:e,sources:t,imageUrl:i}){let n=e.consistency_analyses||[],r=e.statistics?.upstream_issue_types||{},a=e.statistics?.program_issue_types,o=e.dataset_profile?Qa[e.dataset_profile.dataset_format]:Object.keys(r),l=Math.max(1,...o.flatMap(u=>[a?.[u]||0,r[u]?.image_count||0])),s=[{key:"scope",title:"\u5BF9\u7167\u56FE\u4E0E\u6BD4\u8F83\u7ED3\u679C",items:Object.entries(ar).map(([u,h])=>({key:u,title:h,description:u==="MODEL_REVIEWED:EQUIVALENT"&&e.dataset_profile?.dataset_format==="folder_classification"?"\u5DF2\u6709\u5185\u5BB9\u76F8\u540C\u7684\u5BF9\u7167\u56FE\uFF0C\u53CC\u65B9\u7684\u6574\u56FE\u6807\u7B7E\u76F8\u540C\u3002":qu[u]}))},{key:"conflict",title:"\u6807\u6CE8\u51B2\u7A81\u7C7B\u522B",items:o.map(u=>({key:u,title:xi[u],description:Wu[u]}))}],d=["NO_CANDIDATES","NO_ELIGIBLE_CANDIDATES","MODEL_REVIEWED:EQUIVALENT",...t.filter(u=>["MODEL_REVIEWED:MATERIAL","MODEL_REVIEWED:UNCERTAIN"].includes(u.key)&&u.value>0).map(u=>u.key)];return(0,M.jsxs)("section",{className:"iad-report-section",children:[(0,M.jsx)("h2",{children:"\u4E8C\u3001\u6570\u636E\u662F\u5426\u81EA\u6D3D"}),(0,M.jsx)("p",{children:e.consistency_analysis}),(0,M.jsx)(ie,{level:3,number:"2.1",children:"\u5404\u7C7B\u7ED3\u679C\u662F\u4EC0\u4E48\u610F\u601D"}),(0,M.jsx)("p",{children:"\u4E3B\u56FE\u662F\u5F53\u524D\u88AB\u68C0\u67E5\u7684\u56FE\uFF0C\u5BF9\u7167\u56FE\u662F\u62FF\u6765\u4E0E\u5B83\u6BD4\u8F83\u7684\u53E6\u4E00\u5F20\u56FE\u3002\u4E0B\u9762\u7684\u5DEE\u5F02\u90FD\u6309\u4E3B\u56FE\u76F8\u5BF9\u5BF9\u7167\u56FE\u6765\u63CF\u8FF0\u3002"}),s.filter(u=>u.items.length).map(u=>(0,M.jsxs)("table",{className:"iad-audit-definitions","data-consistency-definitions":u.key,children:[(0,M.jsx)("caption",{children:u.title}),(0,M.jsx)("thead",{children:(0,M.jsxs)("tr",{children:[(0,M.jsx)("th",{scope:"col",children:"\u7C7B\u522B"}),(0,M.jsx)("th",{scope:"col",children:"\u542B\u4E49"})]})}),(0,M.jsx)("tbody",{children:u.items.map(h=>(0,M.jsxs)("tr",{children:[(0,M.jsx)("th",{scope:"row",children:h.title}),(0,M.jsx)("td",{children:h.description})]},h.key))})]},u.key)),!!t.length&&(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(ie,{level:3,number:"2.2",children:"\u7A0B\u5E8F\u7EDF\u8BA1\u4E0E\u6A21\u578B\u590D\u6838\u7EDF\u8BA1"}),(0,M.jsx)("p",{children:"\u4E0B\u9762\u7684\u7EDF\u8BA1\u6765\u81EA\u672C\u6B21\u9009\u7528\u7684\u4E00\u81F4\u6027\u68C0\u67E5\u3002\u7A0B\u5E8F\u6839\u636E\u539F\u59CB\u6807\u6CE8\u7684\u5339\u914D\u7ED3\u679C\u627E\u51FA\u5DEE\u5F02\uFF0C\u6A21\u578B\u518D\u7ED3\u5408\u56FE\u50CF\u5185\u5BB9\u590D\u6838\u3002\u4E24\u5F20\u5206\u7C7B\u56FE\u90FD\u6309\u4E3B\u56FE\u8BA1\u6570\uFF1A\u540C\u4E00\u5F20\u56FE\u5728\u540C\u4E00\u7C7B\u4E2D\u53EA\u7B97\u4E00\u6B21\uFF0C\u4E0D\u540C\u7C7B\u578B\u53EF\u4EE5\u91CD\u53E0\u3002"}),!!o.length&&a!=null&&(0,M.jsx)(wi,{kind:"program-conflicts",title:"\u7A0B\u5E8F\u7EDF\u8BA1\uFF1A\u6807\u6CE8\u5DEE\u5F02\u5206\u7C7B",unit:"\u5F20",maximum:l,rows:o.map(u=>({label:xi[u],value:a[u]||0}))}),!!o.length&&(0,M.jsx)(wi,{kind:"model-conflicts",title:"\u6A21\u578B\u590D\u6838\u7EDF\u8BA1\uFF1A\u6807\u6CE8\u51B2\u7A81\u5206\u7C7B",unit:"\u5F20",maximum:l,rows:o.map(u=>({label:xi[u],value:r[u]?.image_count||0}))}),(0,M.jsx)(wi,{kind:"consistency",title:"\u6765\u6E90\u68C0\u67E5\u7684\u5BF9\u7167\u56FE\u4E0E\u6BD4\u8F83\u7ED3\u679C",unit:"\u5F20",rows:t}),d.map((u,h)=>(0,M.jsxs)("article",{className:"iad-audit-discovery","data-consistency-scope":u,children:[(0,M.jsx)(ie,{level:3,number:"2."+(h+3),children:ar[u]}),(0,M.jsxs)("p",{children:[t.find(p=>p.key===u)?.value||0," \u5F20\u56FE\u50CF"]}),(e.consistency_scopes||[]).filter(p=>p.source_status===u).map(p=>(0,M.jsx)("p",{children:p.analysis},p.source_status)),(0,M.jsx)(st,{items:e.evidence_groups["scope:"+u]||[],imageUrl:i,heading:{level:4,number:"2."+(h+3)+".1"}})]},u))]}),n.filter(u=>a?.[u.issue_type]||r[u.issue_type]?.occurrences).map((u,h)=>{let p=r[u.issue_type];return(0,M.jsx)("article",{className:"iad-audit-discovery",children:(0,M.jsx)(pn,{content:{number:"2."+(d.length+h+3),title:u.title||xi[u.issue_type],description:u.description||"",facts:[...a==null?[]:[{label:"\u7A0B\u5E8F\u53D1\u73B0\u5DEE\u5F02",text:`${a[u.issue_type]||0} \u5F20\u56FE\u50CF`}],{label:"\u6A21\u578B\u590D\u6838\u540E\u4FDD\u7559",text:`${p?.image_count||0} \u5F20\u56FE\u50CF\uFF0C${p?.occurrences||0} \u9879`}],galleries:[{title:"\u56FE\u50CF\u8BC1\u636E",images:u.related_case_ids?.length?vr(e,u.related_case_ids):e.evidence_groups["consistency:"+u.issue_type]||[]}],analysis:[{title:"\u56FE\u50CF\u89C2\u5BDF\u4E0E\u5BF9\u7167",text:u.analysis},{title:"\u672C\u6B21\u5224\u65AD",text:u.audit_result||""}]},imageUrl:i})},u.issue_type)})]})}var ei=I(N(),1);function Cg({report:e,imageUrl:t}){let i=e.knowledge_entries||[];return(0,ei.jsxs)("section",{className:"iad-report-section",children:[(0,ei.jsx)("h2",{children:"\u516B\u3001\u5F15\u7528\u77E5\u8BC6\u53CA\u5BA1\u8BA1\u7ED3\u679C"}),e.knowledge_analysis&&(0,ei.jsx)("p",{children:e.knowledge_analysis}),!i.length&&(0,ei.jsx)("p",{children:Object.values(e.knowledge_titles).join("\u3001")||"\u672C\u6B21\u672A\u9009\u7528\u77E5\u8BC6\u6761\u76EE\u3002"}),i.map(({entry:n,analysis:r},a)=>{let o=n.check,l=e.statistics?.knowledge_assessments?.[o.check_id]||{},s=[["consistent","\u4E00\u81F4"],["deviates","\u504F\u79BB"],["unobservable","\u4E0D\u53EF\u89C2\u5BDF"],["not_applicable","\u4E0D\u9002\u7528"]].map(([d,u])=>`${u} ${l[d]||0} \u5F20`).join("\uFF1B");return(0,ei.jsx)("article",{className:"iad-audit-discovery","data-audit-knowledge":o.check_id,children:(0,ei.jsx)(pn,{content:{number:"8."+(a+1),title:o.title,description:r?.description||o.criterion,facts:[{label:"\u77E5\u8BC6\u72B6\u6001",text:ed[o.status]},{label:"\u9010\u56FE\u6838\u5BF9",text:s}],galleries:[{title:"\u77E5\u8BC6\u56FE\u50CF\u8BC1\u636E",images:e.evidence_groups["knowledge-source:"+o.check_id]||[]},{title:"\u672C\u6B21\u5BA1\u8BA1\u5BF9\u7167\u56FE",images:e.evidence_groups["knowledge:"+o.check_id]||[]}],analysis:[...r?[{title:"\u9002\u7528\u60C5\u51B5",text:r.applicability},{title:"\u56FE\u50CF\u89C2\u5BDF\u4E0E\u5BF9\u7167",text:r.analysis},{title:"\u5BA1\u8BA1\u4F5C\u7528",text:r.audit_impact}]:[]]},imageUrl:t})},o.check_id)})]})}var b=I(N(),1),lv={physical_sample_id:"\u7269\u7406\u4EF6",capture_sequence_id:"\u91C7\u96C6\u5E8F\u5217",batch_id:"\u6279\u6B21",station:"\u7AD9\u70B9",camera:"\u76F8\u673A",data_origin:"\u6765\u6E90"};function Rg({report:e,imageUrl:t}){let i=e.statistics,n=e.dataset_profile,{coverage_topics:r=[],report_cases:a=[],capability_topics:o=[]}=e,l=n?Qa[n.dataset_format]:Object.keys(i?.issue_types||{}),s=i?Object.entries(ar).map(([p,x])=>({key:p,label:x,value:Object.values(i.consistency_cross[p]||{}).reduce((v,g)=>v+g,0)})):[],d=s.filter(p=>p.key.startsWith("MODEL_REVIEWED:")).reduce((p,x)=>p+x.value,0),u=e.capabilities.some(p=>p.readiness_status!=="not_evaluated"),h=a.filter(p=>p.evidence_refs.some(x=>x.kind==="finding"));return(0,b.jsxs)("article",{className:"iad-audit-document",children:[(0,b.jsxs)("header",{className:"iad-audit-report-intro",children:[(0,b.jsx)("h1",{children:"\u6A21\u578B\u5BA1\u8BA1\u62A5\u544A"}),(0,b.jsx)("p",{children:Object.values(e.dataset_names).join("\u3001")}),(0,b.jsxs)("div",{className:"iad-audit-report-meta",children:[(0,b.jsxs)("span",{children:["\u5BA1\u8BA1\u8986\u76D6 ",e.audited_samples," / ",e.total_samples," \u5F20"]}),e.model_name&&(0,b.jsxs)("span",{children:["\u5BA1\u8BA1\u6A21\u578B ",e.model_name]}),e.finished_at&&(0,b.jsxs)("span",{children:["\u62A5\u544A\u5B8C\u6210\u65F6\u95F4 ",new Date(e.finished_at).toLocaleString("zh-CN",{hour12:!1})]}),n&&(0,b.jsxs)("span",{children:["\u6570\u636E\u683C\u5F0F ",n.dataset_format==="labelme"?"Labelme":"\u76EE\u5F55\u5206\u7C7B"]})]})]}),(0,b.jsxs)("section",{className:"iad-report-section",children:[(0,b.jsx)("h2",{children:"\u4E00\u3001\u603B\u4F53\u7ED3\u8BBA"}),(0,b.jsx)("p",{children:e.conclusion||"\u6574\u4F53\u5206\u6790\u5C1A\u672A\u5B8C\u6210\u3002"}),i&&(0,b.jsxs)("p",{children:["\u5DF2\u68C0\u67E5 ",i.completed_images," \u5F20\u56FE\u50CF\uFF0C\u5176\u4E2D ",i.suspect_images," \u5F20\u9700\u8981\u590D\u6838\u3002",!!s.length&&(0,b.jsxs)(b.Fragment,{children:["\u5DF2\u6709\u7684\u4E00\u81F4\u6027\u68C0\u67E5\u5BF9 ",d," \u5F20\u56FE\u50CF\u505A\u8FC7\u8DE8\u56FE\u6BD4\u8F83\u3002"]})]}),(0,b.jsx)(wi,{kind:"outcomes",title:"\u672C\u8F6E\u5BA1\u8BA1\u7ED3\u679C",unit:"\u5F20",rows:[{label:"\u5BA1\u8BA1\u6B63\u5E38",value:i?.normal_images??e.distribution.normal??0},{label:"\u53D1\u73B0\u7591\u70B9",value:e.suspect_samples},{label:"\u672A\u5B8C\u6210",value:e.total_samples-e.audited_samples}]})]}),(0,b.jsx)(_g,{report:e,sources:s,imageUrl:t}),(0,b.jsxs)("section",{className:"iad-report-section",children:[(0,b.jsx)("h2",{children:"\u4E09\u3001\u6807\u6CE8\u8D28\u91CF\u4E0E\u590D\u6838\u91CD\u70B9"}),i?i.suspect_images>0?(0,b.jsxs)("p",{children:["\u6709 ",i.suspect_images," \u5F20\u56FE\u50CF\u9700\u8981\u590D\u6838\uFF0C\u5171 ",i.issue_occurrences," \u5904\u3002",i.suspect_rate_among_completed!==null&&(0,b.jsxs)(b.Fragment,{children:["\u5360\u5DF2\u5B8C\u6210\u56FE\u50CF\u7684 ",(100*i.suspect_rate_among_completed).toLocaleString("zh-CN",{maximumFractionDigits:2}),"%\u3002"]})]}):(0,b.jsx)("p",{children:"\u672C\u6B21\u5DF2\u5B8C\u6210\u7684\u56FE\u50CF\u68C0\u67E5\u4E2D\uFF0C\u6CA1\u6709\u53D1\u73B0\u9700\u8981\u4FDD\u7559\u7684\u6807\u6CE8\u7591\u70B9\u3002"}):(0,b.jsx)("p",{children:"\u672C\u4F5C\u4E1A\u5C1A\u65E0\u8D28\u91CF\u6C47\u603B\u7EDF\u8BA1\u3002"}),!!i?.issue_occurrences&&(0,b.jsx)(wi,{kind:"issues",title:"\u9700\u8981\u590D\u6838\u7684\u95EE\u9898",unit:"\u9879",rows:l.map(p=>({label:xi[p],value:i.issue_types[p]?.occurrences??0}))}),h.map((p,x)=>(0,b.jsx)("article",{className:"iad-audit-discovery",children:(0,b.jsx)(pn,{content:{number:"3."+(x+1),title:p.title,description:p.observation,galleries:[{title:"\u56FE\u50CF\u8BC1\u636E",images:vr(e,[p.case_id])}],analysis:[{title:"\u8DE8\u56FE\u5BF9\u7167",text:p.comparison},{title:"\u590D\u6838\u91CD\u70B9",text:p.significance}]},imageUrl:t})},p.case_id)),!!e.review_priorities.length&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(ie,{level:3,number:"3."+(h.length+1),children:"\u590D\u6838\u91CD\u70B9"}),(0,b.jsx)("ul",{children:e.review_priorities.map((p,x)=>(0,b.jsx)("li",{children:p},x))})]})]}),(0,b.jsxs)("section",{className:"iad-report-section",children:[(0,b.jsx)("h2",{children:"\u56DB\u3001\u8986\u76D6\u4E86\u54EA\u4E9B\u89C6\u89C9\u573A\u666F"}),(0,b.jsx)("p",{children:e.coverage_analysis}),r.map((p,x)=>(0,b.jsxs)("article",{className:"iad-audit-discovery","data-audit-topic":"coverage",children:[(0,b.jsx)(ie,{level:3,number:"4."+(x+1),children:p.title}),(0,b.jsx)("p",{children:p.analysis}),(0,b.jsx)(nd,{ids:p.related_case_ids||[],report:e,imageUrl:t,heading:{level:4,number:"4."+(x+1)+".1"}}),!p.related_case_ids?.length&&(0,b.jsx)(st,{items:e.evidence_groups["coverage:"+x]||[],imageUrl:t,heading:{level:4,number:"4."+(x+1)+".1"}})]},x)),!a.length&&e.discoveries.map((p,x)=>(0,b.jsxs)("article",{className:"iad-audit-discovery","data-audit-discovery":p.group_id,children:[(0,b.jsx)(ie,{level:3,number:"4."+(r.length+x+1),children:p.title}),(0,b.jsx)("p",{children:p.description}),(0,b.jsx)(st,{items:e.evidence_groups[p.group_id]||[],imageUrl:t,heading:{level:4,number:"4."+(r.length+x+1)+".1"}})]},p.group_id))]}),(0,b.jsxs)("section",{className:"iad-report-section",children:[(0,b.jsx)("h2",{children:"\u4E94\u3001\u6837\u672C\u72EC\u7ACB\u6027\u4E0E\u4EE3\u8868\u6027"}),(0,b.jsx)("p",{children:e.independence_analysis}),n&&(0,b.jsxs)("dl",{className:"iad-report-data",children:[Object.entries(n.metadata).filter(([,p])=>p.covered_images>0).map(([p,x])=>(0,b.jsxs)("div",{children:[(0,b.jsx)("dt",{children:lv[p]}),(0,b.jsxs)("dd",{children:[x.distinct_count," \u79CD\u767B\u8BB0\u503C\uFF0C\u8986\u76D6 ",x.covered_images," / ",n.total_images," \u5F20\u56FE\u50CF"]})]},p)),n.strict_duplicate_groups!==null&&(0,b.jsxs)("div",{children:[(0,b.jsx)("dt",{children:"\u4E25\u683C\u91CD\u590D"}),(0,b.jsxs)("dd",{children:[n.strict_duplicate_groups," \u7EC4\uFF0C\u6D89\u53CA ",n.strict_duplicate_images," \u5F20\u56FE\u50CF"]})]}),n.near_candidate_pairs>0&&(0,b.jsxs)("div",{children:[(0,b.jsx)("dt",{children:"\u76F8\u8FD1\u5019\u9009"}),(0,b.jsxs)("dd",{children:[n.near_candidate_pairs," \u5BF9"]})]})]})]}),(0,b.jsxs)("section",{className:"iad-report-section",children:[(0,b.jsx)("h2",{children:"\u516D\u3001\u80FD\u591F\u68C0\u9A8C\u6A21\u578B\u54EA\u4E9B\u80FD\u529B"}),o.map((p,x)=>(0,b.jsxs)("article",{className:"iad-audit-discovery",children:[(0,b.jsx)(ie,{level:3,number:"6."+(x+1),children:p.title}),(0,b.jsx)("p",{children:p.summary}),p.points.map((v,g)=>(0,b.jsxs)("section",{"data-capability-point":!0,children:[(0,b.jsx)(ie,{level:4,number:"6."+(x+1)+"."+(g+1),children:v.title}),(0,b.jsx)("p",{children:v.observation_and_comparison}),(0,b.jsx)("p",{children:v.evaluation_value}),(0,b.jsx)(nd,{ids:v.case_ids,report:e,imageUrl:t,heading:{level:5,number:"6."+(x+1)+"."+(g+1)+".1"}})]},g)),!!p.missing_conditions.length&&(0,b.jsx)("p",{children:p.missing_conditions.join("\uFF1B")})]},x)),!!o.length&&e.capabilities.some(p=>p.coverage_status==="not_observed")&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(ie,{level:3,number:"6."+(o.length+1),children:"\u5C1A\u7F3A\u7684\u80FD\u529B\u573A\u666F\u6216\u8BC4\u6D4B\u8BC1\u636E"}),(0,b.jsx)("ul",{children:e.capabilities.filter(p=>p.coverage_status==="not_observed").map(p=>(0,b.jsxs)("li",{children:[Os[p.tag],"\uFF1A",p.reason]},p.tag))})]}),!o.length&&e.capabilities.map((p,x)=>(0,b.jsxs)("article",{className:"iad-audit-discovery",children:[(0,b.jsx)(ie,{level:3,number:"6."+(x+1),children:Os[p.tag]}),(0,b.jsx)("p",{children:(0,b.jsx)("span",{className:"iad-audit-status","data-status":p.coverage_status,children:Vu[p.coverage_status]})}),(0,b.jsx)("p",{children:p.reason}),!!p.missing_conditions.length&&(0,b.jsx)("p",{children:p.missing_conditions.join("\uFF1B")}),u&&(0,b.jsxs)("p",{children:[p.readiness_track&&(0,b.jsxs)(b.Fragment,{children:[p.readiness_track,"\uFF0C"]}),js[p.readiness_status]]}),(0,b.jsx)(st,{items:e.evidence_groups["capability:"+p.tag]||[],imageUrl:t,heading:{level:4,number:"6."+(x+1)+".1"}})]},p.tag))]}),(0,b.jsxs)("section",{className:"iad-report-section",children:[(0,b.jsx)("h2",{children:"\u4E03\u3001\u5F53\u524D\u9002\u5408\u54EA\u4E9B\u7528\u9014\u3001\u8FD8\u7F3A\u4EC0\u4E48"}),e.usability.map((p,x)=>(0,b.jsxs)("article",{className:"iad-audit-discovery",children:[(0,b.jsx)(ie,{level:3,number:"7."+(x+1),children:Qu[p.purpose]}),(0,b.jsx)("p",{children:(0,b.jsx)("span",{className:"iad-audit-status","data-status":p.status,children:Gu[p.status]})}),(0,b.jsx)("p",{children:p.reason})]},p.purpose)),n?.benchmark&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(ie,{level:3,number:"7."+(e.usability.length+1),children:"\u5DF2\u6709\u8BC4\u6D4B\u6210\u679C"}),(0,b.jsxs)("p",{children:["\u5212\u5206\u8986\u76D6\u672C\u6B21\u5BA1\u8BA1 ",n.benchmark.covered_images," / ",n.total_images," \u5F20\u56FE\u50CF\uFF0C",n.benchmark.source_matches_scope?"\u4E0E\u5BA1\u8BA1\u8303\u56F4\u4E00\u81F4\u3002":"\u6210\u679C\u8303\u56F4\u4E0E\u5BA1\u8BA1\u8303\u56F4\u4E0D\u540C\u3002"]}),Object.entries(n.benchmark.readiness).map(([p,x],v)=>(0,b.jsxs)("section",{children:[(0,b.jsx)(ie,{level:4,number:"7."+(e.usability.length+1)+"."+(v+1),children:x.track_name}),(0,b.jsx)("p",{children:js[x.status.toLowerCase()]}),(0,b.jsx)("p",{children:x.reason})]},p))]}),!!e.limitations.length&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(ie,{level:3,number:"7."+(e.usability.length+1+(n?.benchmark?1:0)),children:"\u5F53\u524D\u7F3A\u5931\u6761\u4EF6"}),e.limitations.map((p,x)=>(0,b.jsx)("p",{children:p},x))]})]}),(0,b.jsx)(Cg,{report:e,imageUrl:t})]})}var sv="--iad-canvas:#141B25;--iad-surface:#202B3A;--iad-navigation:#182231;--iad-surface-muted:#293648;--iad-text:#EDF2F8;--iad-muted:#B4C0D0;--iad-border:#4C5B6E;--iad-panel-border:var(--iad-border);--iad-section-border:var(--iad-border);--iad-control-border:#8393AA;--iad-primary:#A7C5FF;--iad-primary-fill:#315FC9;--iad-hover:#293E60;--iad-success:#92D7B0;--iad-warning:#F3C280;--iad-danger:#FFB7B1;--iad-viewer:#10161F;",Ng=`
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
[data-ds-dark-theme] {${sv}}
[data-shortcut-modal="settings"] > nav {border-inline-end:1px solid var(--iad-panel-border)}
`;var zg=`
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
`;var Pg=`
.iad-model-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:0 0 16px}.iad-model-fields .iad-field{min-width:0;margin:0}.iad-provider-manager{min-width:0}.iad-provider-manager>.iad-muted{margin-bottom:20px}.iad-provider-manager>.iad-table-scroll{background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-provider-manager input{max-width:100%}.iad-provider-endpoint{overflow-wrap:anywhere;max-width:420px}.iad-provider-dialog{width:min(780px,calc(100vw - 32px))}.iad-provider-dialog fieldset{border:0;padding:0;margin:0;min-width:0}.iad-provider-model{padding:12px 16px;margin:12px 0;background:var(--iad-surface-muted);border-radius:8px}.iad-provider-model .iad-row{justify-content:space-between}
`;var Lg=`
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



`;var Tg=`.iad-detail-dialog,.iad-floating-menu-panel{overflow-wrap:anywhere;font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
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

`;var Ag=`.iad-main {display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start;}
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
`;var Og=`
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
`;var jg=`.iad-viewer-hint{margin:0;padding:8px 20px;flex:none;border-top:1px solid var(--iad-control-border);color:color-mix(in srgb,var(--iad-on-viewer) 75%,var(--iad-viewer));font-size:.75rem;background:var(--iad-viewer)}.iad-viewer-zoom{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.iad-viewer-evidence-group h4{font-size:.75rem;color:var(--iad-muted);font-weight:500;margin:16px 0 8px}.iad-viewer-heading{flex:1;min-width:160px;overflow:hidden}.iad-viewer-heading strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iad-viewer-heading small{display:block;margin-top:4px;font-size:.75rem;color:var(--iad-muted)}
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

`;var Mg=`
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

`;var Dg=`.iad-workbench[data-page=industrial-review]:has(.iad-review-focused) {display:flex;flex-direction:column;overflow:auto;}
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

`;var Fg=`
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

`;var Ug=`.iad-setup {max-width:1040px;min-width:0;padding:24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);}.iad-workbench .iad-short-field{flex:none;width:88px;margin:0 0 16px}.iad-short-field input{width:100%}.iad-form-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;padding-top:20px;margin-top:24px;border-top:1px solid var(--iad-border)}.iad-form-footer>.iad-muted{margin-right:auto}
.iad-setup-section {padding:var(--iad-space-6) 0;border-bottom:1px solid var(--iad-border);}
.iad-setup-section:first-of-type {padding-top:0;}.iad-setup-section:last-child {border:0;}
.iad-setup-section>h3 {margin:0 0 var(--iad-space-4);}
.iad-agent-prompts{display:grid;gap:16px;min-width:0}
.iad-agent-prompts+.iad-agent-prompts{margin-top:16px}
.exp-input textarea.iad-prompt-editor{--iad-prompt-editor-height:300px;box-sizing:border-box;width:100%;height:var(--iad-prompt-editor-height);min-height:var(--iad-prompt-editor-height);max-height:var(--iad-prompt-editor-height);resize:none;overflow:auto}
.iad-setup-section .iad-info-group {background:transparent;padding:0;margin:0;}
`;var Bg=`
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

`;var Hg=`
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
`;var Vg=`
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
`;var Qg=`
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
  scrollbar-gutter: stable;
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
`;var Gg=`
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
`;var Wg=`#audit-page { --audit-ink:#172338; --audit-border:#dbe2eb; --audit-blue:#285ed6; --audit-bg:#fff; color:var(--audit-ink); font:13px/1.5 system-ui,"Microsoft YaHei","PingFang SC",sans-serif; padding:0 0 64px; min-width:0; }
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
@media(max-width:780px){#audit-page{padding:0 0 40px}#audit-page .audit-scope-parent,#audit-page .audit-scope-child{width:100%}#audit-page .audit-report-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#audit-page .audit-kpi{border-top:1px solid var(--audit-border)}#audit-page .audit-report-columns{grid-template-columns:1fr}#audit-page .audit-overlay{padding:12px}#audit-page .audit-dialog{width:calc(100vw - 24px);height:calc(100dvh - 24px)}#audit-page .audit-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:9px;padding:12px}#audit-page .audit-thumb{height:122px}#audit-page .audit-dialog-body{padding:16px}}`;var qg=`
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
`;var Kg=`
.iad-section-heading{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px var(--iad-layout-inline-gap);min-height:var(--iad-layout-section-height);padding:8px var(--iad-layout-section-inset);margin:0;border-bottom:1px solid var(--iad-section-border);background:var(--iad-surface)}
.iad-section-heading>h2{font-size:16px;font-weight:650;line-height:24px;letter-spacing:0;color:var(--iad-text);margin:0;padding:0}
.iad-section-actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:10px 16px;margin-left:auto;min-width:0}
`;var $g=`
.iad-workbench.iad-business-page{width:100%;max-width:none;margin-inline:0;padding:var(--iad-layout-top) var(--iad-layout-inset) var(--iad-layout-bottom)}
.iad-business-page .iad-header{display:flex;align-items:center;justify-content:space-between;gap:var(--iad-layout-inline-gap);min-height:var(--iad-layout-title-height);margin:0 0 var(--iad-layout-gap)}
.iad-business-page .iad-header h1{margin:0;padding:0;color:var(--iad-text);font-size:24px;font-weight:670;line-height:1.35;letter-spacing:-.4px}
`;var Yg=`
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
#audit-page .iad-audit-document h3{font-size:20px;line-height:1.55;margin:18px 0 0;font-weight:650}
#audit-page .iad-audit-document h4{font-size:17px;line-height:1.6;margin:6px 0 0;font-weight:650}
#audit-page .iad-audit-document h5{font-size:15px;line-height:1.6;margin:4px 0 0;font-weight:650}
[data-capability-point]{display:grid;gap:10px;padding:8px 0}
#audit-page .iad-audit-document p{font-size:14px;line-height:1.9;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.iad-audit-report-intro{display:grid;gap:10px;padding:2px 0 28px}
.iad-audit-report-meta{--iba-unified-body-size:13px;--iba-unified-ink:var(--text-secondary,#536174);display:flex;flex-wrap:wrap;gap:8px 24px;color:var(--text-secondary,#536174);font-size:13px}
.iad-audit-document>.iad-report-section{display:grid;gap:14px;border-top:1px solid var(--audit-border,#dbe2eb);padding:30px 0}
#audit-page .iad-dataset-report>.audit-panel-head{border-bottom:0;background:#fff;justify-content:flex-end;padding-bottom:0}
.iad-audit-status{display:inline-block;border-radius:4px;padding:1px 9px;background:#eff2f6;color:#536174;white-space:nowrap;font-size:13px;font-weight:400}
.iad-audit-status:is([data-status=usable],[data-status=observed],[data-status=supported]){background:#e6f2eb;color:#286b49}
.iad-audit-status:is([data-status=candidate],[data-status=disputed],[data-status=pending]){background:#fff4e5;color:#835515}
.iad-audit-discovery{display:grid;gap:12px;padding:10px 0 18px;min-width:0;break-inside:avoid}
.iad-audit-definitions{width:100%;border-collapse:collapse;table-layout:fixed;text-align:left;font-size:14px;line-height:1.8}
.iad-audit-definitions caption{text-align:left;font-size:16px;font-weight:600;padding:8px 0}
.iad-audit-definitions th,.iad-audit-definitions td{padding:9px 12px;border-bottom:1px solid var(--audit-border,#dbe2eb);vertical-align:top}
.iad-audit-definitions th:first-child{width:136px;white-space:nowrap;font-weight:600}
.iad-audit-definitions thead{background:var(--iad-surface-muted,#f5f7fa)}
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
@media(max-width:600px){#audit-page .iad-audit-document h1{font-size:25px}#audit-page .iad-audit-document h2{font-size:21px}#audit-page .iad-audit-document h3{font-size:18px}#audit-page .iad-audit-document h4{font-size:16px}.iad-audit-document>.iad-report-section{padding:24px 0}.iad-audit-chart-bars{height:180px;gap:6px}.iad-audit-chart-labels{gap:6px;font-size:12px}}
@media print{.iad-audit-gallery nav,.iad-fullscreen-dialog{display:none!important}.iad-audit-document>.iad-report-section{break-inside:auto}.iad-audit-gallery .iad-thumbnail-card{break-inside:avoid}}
`;var Xg=`
.iad-tabs[role=tablist] {flex-shrink:0;display:flex;align-items:center;gap:23px;max-width:100%;overflow-x:auto;white-space:nowrap;scrollbar-width:thin;border:0;border-bottom:1px solid var(--iad-border);margin:1px 0 16px;padding:0;}
.iad-tabs[role=tablist] > button[role=tab] {position:relative;display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;box-sizing:border-box;height:var(--iad-tab-height);min-height:var(--iad-tab-height);padding:0 1px;margin:0;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--iad-muted);font:inherit;font-size:var(--iad-font-size);font-weight:400;box-shadow:none;cursor:pointer;}
.iad-tabs[role=tablist] > button[role=tab][aria-selected=true] {color:var(--iad-primary);border-bottom-color:var(--iad-primary);font-weight:600;}
.iad-tabs[role=tablist] > button[role=tab]:hover {background:transparent;color:var(--iad-primary);}
.iad-tabs[role=tablist] > button[role=tab]:focus-visible {outline:2px solid var(--iad-primary);outline-offset:-2px;}
.iad-tabs .iad-tab-count {font-size:12px;color:inherit;font-weight:500;opacity:.85;font-variant-numeric:tabular-nums;}
.iad-tab-panel {min-width:0;}
.iad-tab-panel:focus-visible {outline:2px solid var(--iad-primary);outline-offset:2px;}
@media(max-width:640px) {.iad-tabs[role=tablist] {gap:15px;}}
`;var Zg=`
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
`;var Jg=`
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
`;var em=Ng+Jg+Pg+Lg+Tg+Ag+Og+jg+Mg+Dg+Fg+Ug+Bg+Hg+Vg+Qg+Gg+Wg+zg+Zg+Xg+qg+Yg+$g+Kg;var yr=I(N(),1),dv=document.getElementById("audit-report-data"),{report:pv,images:cv}=JSON.parse(dv.textContent),im=document.createElement("style");im.textContent=em+`
body{margin:0;background:#fff}.iad-offline-report{width:100%;margin:24px auto;padding:0 20px}`;document.head.append(im);(0,tm.createRoot)(document.getElementById("audit-offline-root")).render((0,yr.jsx)("main",{className:"iad-workbench iad-offline-report",id:"audit-page",children:(0,yr.jsx)("section",{className:"iad-dataset-report",id:"audit-report",children:(0,yr.jsx)("div",{className:"iad-report-body",children:(0,yr.jsx)(Rg,{report:pv,imageUrl:e=>cv[e.image.evidence_id]})})})}));})();
