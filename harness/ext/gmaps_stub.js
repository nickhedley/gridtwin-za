// A minimal stand-in for the Maps JavaScript API, enough for the rooftop map's calls.
(function(){
  const L=()=>({ listeners:{}, addListener(ev,fn){ (this.listeners[ev]=this.listeners[ev]||[]).push(fn); return {remove(){}}; }, _fire(ev,e){ (this.listeners[ev]||[]).forEach(f=>f(e)); } });
  function Map(el,opts){ Object.assign(this,L()); this._opts=opts; this._z=opts.zoom; this._c=opts.center; el.innerHTML='<div class="gm-stub" style="width:100%;height:100%;background:#334"></div>'; }
  Map.prototype.setCenter=function(c){this._c=c;}; Map.prototype.setZoom=function(z){this._z=z;}; Map.prototype.getZoom=function(){return this._z;};
  Map.prototype.setOptions=function(o){Object.assign(this._opts,o);}; Map.prototype.fitBounds=function(b){this._fit=b; setTimeout(()=>this._fire('idle'),0);};
  function Shape(o){ Object.assign(this,L()); this.o=o; this.map=o.map||null; } Shape.prototype.setMap=function(m){this.map=m;};
  const places={ AutocompleteService:function(){ this.getPlacePredictions=(req,cb)=>setTimeout(()=>cb([{place_id:'P1',description:'x',structured_formatting:{main_text:'12 Jan Smuts Avenue',secondary_text:'Places street, Parktown'}}],'OK'),10); },
    AutocompleteSessionToken:function(){}, PlacesService:function(){ this.getDetails=(req,cb)=>setTimeout(()=>cb({formatted_address:'12 Jan Smuts Avenue, Parktown',geometry:{location:{lat:()=>-26.2041,lng:()=>28.0473},location_type:'ROOFTOP'}},'OK'),10); },
    PlacesServiceStatus:{OK:'OK'} };
  window.google={ maps:{ Map, Marker:Shape, Polyline:Shape, Polygon:Shape, Rectangle:Shape, InfoWindow:function(){ this.setContent=()=>{}; this.setPosition=()=>{}; this.open=()=>{}; this.close=()=>{}; },
    SymbolPath:{CIRCLE:0}, MaxZoomService:function(){ this.getMaxZoomAtLatLng=(ll,cb)=>setTimeout(()=>cb({status:'OK',zoom:21}),5); },
    Geocoder:function(){ this.geocode=(req,cb)=>cb([], 'ZERO_RESULTS'); }, event:{ addListenerOnce:(o,ev,fn)=>o.addListener(ev,fn) }, places } };
})();
