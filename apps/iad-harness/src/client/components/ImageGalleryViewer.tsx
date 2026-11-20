import React from 'react';
import {ImageViewer,type ImageNavigation,type ImageSource} from './ImageViewer.js';

export function ImageGalleryViewer({images,current,onChange,navigation}:{
  images:readonly ImageSource[];current:number|null;onChange(index:number|null):void;navigation?:ImageNavigation;
}) {
  const image=current===null?undefined:images[current];
  if(!image||current===null)return null;
  return <ImageViewer image={image} onClose={()=>onChange(null)} navigation={navigation||(images.length>1?{
    previous:current>0,next:current<images.length-1,busy:false,error:'',move:offset=>onChange(current+offset),
  }:undefined)}/>;
}
