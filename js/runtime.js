(function(global){
    'use strict';

    // Dependencies: ctx, canvas, Event, runtime, sound, soundEffect,
    // canvas/stage stuff
    var _canvas, _ctx;
    function canvas(){
        if (!_canvas){
            if (dom.find){
                _canvas = dom.find('canvas');
            }
            if (!_canvas){
                // We're not running in Waterbear
                // Just put a canvas in so tests pass
                _canvas = document.createElement('canvas');
                _canvas.setAttribute('width', '200');
                _canvas.setAttribute('height', '200');
            }
        }
        return _canvas;
    }

    function getContext(){
        // returns CanvasContext
        if (!_ctx){
            _ctx = canvas().getContext('2d');
            // Save the default state.
            _ctx.strokeStyle = 'transparent';
            _ctx.save();
        }
        return _ctx;
    }
    function resetCanvas() {
        // No context to reset!
        if (!_ctx) {
            return;
        }

        var el = canvas();
        var ctx = getContext();
        ctx.clearRect(0, 0, el.width, el.height);
        // Restore the default state and push it back on the stack again.
        ctx.restore();
        ctx.strokeStyle = 'transparent';
        ctx.save();
    }

    Event.on(window, 'ui:load', null, function(){
        handleResize();
    }, false);

    function handleResize(){
        if(dom.find('wb-playground > canvas')){ //only resize if the canvas is in the playground
            var rect = canvas().getBoundingClientRect();
            Event.stage = {
                // FIXME: Move these to runtime.stage
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                bottom: Math.round(rect.bottom),
                width: Math.round(rect.right) - Math.round(rect.left),
                height: Math.round(rect.bottom) - Math.round(rect.top)
            };
            canvas().setAttribute('width', Event.stage.width);
            canvas().setAttribute('height', Event.stage.height);
        }
    }

    function canvasRect(){
        return new util.Rect(0,0,Event.stage.width,Event.stage.height);
    }

    function clearRuntime() {
        /* FIXME: Event.clearRuntime() should be moved to runtime.js.
         * See: https://github.com/waterbearlang/waterbear/issues/968 */
        Event.clearRuntime();
        clearPerFrameHandlers();
        /* Clear all runtime event handlers. */
        Event.off(null, 'runtime:*');
    }

    var perFrameHandlers;
    var lastTime;
    var animationFrameHandler;

    function clearPerFrameHandlers() {
        perFrameHandlers = [];
        if (animationFrameHandler){
            cancelAnimationFrame(animationFrameHandler);
            animationFrameHandler = null;
        }
    }

    // Initialize the stage.
    Event.on(window, 'ui:resize', null, handleResize);
    Event.on(document.body, 'ui:wb-resize', null, handleResize);

    function startEventLoop(){
        clearPerFrameHandlers();
        lastTime = new Date().valueOf();
        runtime.control._startTime = lastTime;
        runtime.control._frame = 0;
        runtime.control._sinceLastTick = 0;
        animationFrameHandler = requestAnimationFrame(frameHandler);
    }

    function stopEventLoop() {
        /* TODO: Dunno lol there be more in here? */
    }

    function frameHandler(timestamp){
        // where to put these? Event already has some global state.
        if (lastTime === timestamp){
            throw new Exception('There can be only one!');
        }
        runtime.control._elapsed = timestamp - runtime.control._startTime;
        runtime.control._sinceLastTick = timestamp - lastTime;
        runtime.control._frame++;
        lastTime = timestamp;
        perFrameHandlers.forEach(function(handler){
            handler();
        });
        if (perFrameHandlers.length){
            animationFrameHandler = requestAnimationFrame(frameHandler);
        }
    }


    // for all of these functions, `this` is the scope object
    //
    // Contents of runtime (please add new handlers alphabetically)
    //
    // local - special for variables
    // array
    // boolean
    // color
    // control
    // geolocation
    // image
    // math
    // motion
    // object
    // path
    // random
    // rect
    // shape
    // size
    // sound
    // sprite
    // stage
    // string
    // text
    // vector

    global.runtime = {
        startEventLoop: startEventLoop,
        stopEventLoop: stopEventLoop,
        clear: clearRuntime,
        resetCanvas: resetCanvas, // deprecated - refer to "canvas" as "stage"
        getStage: canvas,
        resetStage: resetCanvas,
        handleResize: handleResize,

        local: {
            //temporary fix for locals
            value: function(){
                return this.value;
            }
        },

        array: {
            create: function arrayCreateExpr(){
                var scope = this;
                return []
                    .slice
                    .call(arguments)
                    .map(function(arg){
                        return arg(scope)
                    });
            },
            copy: function arrayCopyExpr(a){
                return a(this).slice();
            },
            itemAt: function arrayItemFromExpr(a,i){
                return a(this)[i(this)];
            },
            join: function arrayJoinExpr(a,s){
                return a(this).join(s(this));
            },
            append: function arrayAppendStep(a,item){
                a(this).push(item(this));
            },
            prepend: function arrayPrependStep(a,item){
                a(this).unshift(item(this));
            },
            length: function arrayLengthExpr(a){
                return a(this).length;
            },
            removeItem: function arrayRemoveItemStep(a,i){
                a(this).splice(i(this),1);
            },
            pop: function arrayPopExpr(a){
                return a(this).pop();
            },
            shift: function arrayShiftExpr(a){
                return a(this).shift();
            },
            reverse: function arrayReverseExpr(a){
                return a(this).reverse();
            }
        },

        'boolean': {
            and: function booleanAndExpr(a,b){
                return a(this) && b(this);
            },
            or: function booleanOrExpr(a,b){
                return a(this) || b(this);
            },
            xor: function booleanXorExpr(a,b){
                return !a(this) !== !b(this);
            },
            not: function booleanNotExpr(a){
                return !a(this);
            }
        },
        color: {
            namedColor: function colorNamedExpr(name){
                // FIXME: We may need to return hex or other color value
                return name(this);
            },
            rgb: function colorRGBExpr(r,g,b){
                return 'rgb(' + r(this) + ',' + g(this) + ',' + b(this) + ')';
            },
            rgba: function colorRGBAExpr(r,g,b,a){
                return 'rgba(' + r(this) + ',' + g(this) + ',' + b(this) + ',' + a()/100 + ')';
            },
            grey: function colorGreyExpr(g){
                return 'rgb(' + g(this) + ',' + g(this) + ',' + g(this) + ')';
            },
            hsl: function colorHSLExpr(h,s,l){
                return 'hsl(' + h(this) + ',' + s(this) + '%,' + l(this) + '%)';
            },
            hsla: function colorHSLAExpr(h,s,l,a){
                return 'hsl(' + h(this) + ',' + s(this) + '%,' + l(this) + '%,' + a()/100 + ')';
            },
            random: function colorRandomExpr(){
                return "#"+(~~(Math.random()*(1<<30))).toString(16).toUpperCase().slice(0,6);
            },
            fill: function colorFillStep(color){
                getContext().fillStyle = color(this);
            },
            stroke: function colorStrokeStep(color){
                getContext().strokeStyle = color(this);
            },
            shadow: function colorShadowStep(color, blur){
                getContext().shadowColor = color(this);
                getContext().shadowBlur = blur(this);
            }
        },

        control: {
            eachFrame: function controlEachFrameCtx(){
                var self = this;
                var containers = this._contains;
                perFrameHandlers.push(function runFrame(){
                    containers[0].forEach(function runBoundBlock(block){
                        block.run(self);
                    });
                });
            },
            frame: function controlFrameExpr(){
                return runtime.control._frame;
            },
            elapsed: function controlElapsedExpr(){
                return runtime.control._elapsed;
            },
            setVariable: function controlSetVariableStep(name, value){
                //FIXME: Make sure this is named properly
                this[name(this)] = value(this);
            },
            getVariable: function controlGetVariableExpr(name){
                return this[name(this)];
            },
            updateVariable: function controlUpdateVariableStep(oldValue, newValue){
                // this is one of the rare times we need access to the element
                var scope = this; // get ready to walk up the scope tree
                var variableName = dom.find(scope._block, 'wb-value').getValue()(this);
                while( scope !== null){
                    if (scope.hasOwnProperty(variableName)){
                        console.assert(scope[variableName] === oldValue(this));
                        scope[variableName] = newValue(this);
                        break;
                    }
                    scope = Object.getPrototypeOf(scope);
                }
                if (scope === null){
                    alert('something went horribly wrong, no variable to set');
                }
            },
            // FIXME: This doesn't seem to have a block
            incrementVariable: function controlIncrementVariableExpr(variable, value){
                this[name(this)] += value(this);
            },
            loopOver: function controlLoopOverCtx(listFn, indexName, valueName) {
                // FIXME: this has to work over arrays, strings, objects, and numbers
                var self = this;
                var list = listFn(this);
                var contained = this._contains[0];
                var type = util.type(list);
                var index, value;
                var i =0,len,keys;
                switch(type){
                    case 'array': // fall through
                    case 'string':
                        len = list.length;
                        break;
                    case 'object':
                        keys = Object.keys(list);
                        len = keys.length;
                        break;
                    case 'number':
                        len = list;
                        break;
                    case 'boolean':
                        len = list ? Infinity : 0
                }

                /* For every element in the container place
                 * the index and value into the scope. */
                /* FIXME: This is the prime spot to break up processing both
                   for debugging and to prevent freezing the browser */
                for (i = 0; i < len; i++){
                    switch(type){
                        // FIXME: Get names of index & value from block
                        case 'array': // fall through
                        case 'string':
                            index = i;
                            value = list[i];
                            break;
                        case 'object':
                            index = keys[i];
                            value = list[this.key];
                            break;
                        case 'number':
                            index = i;
                            value = i;
                            break;
                        case 'boolean':
                            index = i;
                            value = list;
                            if (!list){
                                // hopefully this will handle the case where the value changes after starting the loop
                                return;
                            }
                            break;
                    }
                    contained.forEach(runBlock);
                }
                function runBlock(block){
                    self[indexName(self)] = index;
                    self[valueName(self)] = value;
                    block.run(self);
                }
            },
            broadcast: function controlBroadcastStep(eventName, data){
                // Handle with and without data
                Event.trigger(document.body, eventName(this), data(this));
            },
            receive: function controlReceiveCtx(messageName){
                // Handle with and without data
                // Has a local for the data
                var self = this;
                var contained = this._contains[0];
                Event.on(document.body, 'runtime:' + args[0], null, function(evt){
                    // FIXME: how do I get the local from here?
                    // As an arg would be easiest
                    self[messageName(self)] = evt.detail;
                    contained.forEach(function(block){
                        block.run(self);
                    });
                });
            },
            'if': function controlIfCtx(pred){
                var contained = this._contains[0];
                if (pred(this)){
                    var self = this;
                    contained.forEach(function(block){
                        block.run(self);
                    });
                }
            },
            ifElse: function controlIfElseCtx(pred){
                var self = this;
                var containedTrue = this._contains[0];
                var containedFalse = this._contains[1];
                if (pred(this)){
                    containedTrue.forEach(function(block){
                        block.run(self);
                    });
                }else{
                    containedFalse.forEach(function(block){
                        block.run(self);
                    });
                }
            },
            /* FIXME: This doesn't appear to have a block */
            ternary: function controlTernaryCtx(cond, iftrue, otherwise){
                return cond(this) ? iftrue(this) : otherwise(this);
            },
            ask: function controlAskStep(message, name){
                // Shouldn't this be a context? Or have an on-message handler?
                var answer = prompt(message(this));
                runtime.control.setVariable(name(this), answer);
            },
            comment: function controlCommentStep(){
                // do nothing, it's a comment
            },
            log: function controlLogStep(item){
                console.log(item(this));
            },
            alert: function controlAlertStep(x){
                alert(x(this));
            },
        },


        /*
         * The underlying JavaScript object is the same object that is passed
         * to the getCurrentLocation callback.
         */
        geolocation: {
            /* Synchronous "get current location" */
            currentLocation: function () {
                return util.geolocation.currentLocation;
            },
            /* Asynchronous update event. Context. */
            whenLocationUpdated: function whenLocationUpdatedCtx() {
                var currentScope = this;
                var steps = this._contains[0];

                Event.on(window, 'runtime:locationchanged', null, function (event) {
                    // TODO: probably factor out augmenting scope and running
                    // the block stuff to somewhere else.
                    currentScope['my current location'] = event.detail;
                    steps.forEach(function (block) {
                        block.run(currentScope);
                    });
                });
            },
            // Returns the distance between two points in meters.
            // taken from http://www.movable-type.co.uk/scripts/latlong.html
            // Using the haversine formula.
            distanceBetween: function (p1Fn, p2Fn) {
                var R = 6371000; // m
                var p1 = p1Fn(this);
                var p2 = p2Fn(this);
                var lat1 = p1.coords.latitude;
                var lon1 = p1.coords.longitude;
                var lat2 = p2.coords.latitude;
                var lon2 = p2.coords.longitude;

                var φ1 = util.deg2rad(lat1);
                var φ2 = util.deg2rad(lat2);
                var Δφ = util.deg2rad(lat2-lat1);
                var Δλ = util.deg2rad(lon2-lon1);

                var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

                return R * c;
            },
            /* Returns latitude in degrees. */
            // TODO: should this return a "degrees" object?
            latitude: function (location) {
                return location(this).coords.latitude;
            },
            /* Returns longitude in degrees. */
            // TODO: should this return a "degrees" object?
            longitude: function (location) {
                return location(this).coords.longitude;
            },
            /* Returns altitude as a unit? */
            altitude: function (location) {
                return location(this).coords.altitude;
            },
            /* Returns degrees from north. */
            heading: function (location) {
                // TODO: What do we do when this is NaN or NULL?
                return location(this).coords.heading;
            },
            /* Returns estimated speed. */
            speed: function (location) {
                // TODO: What do we do when this is NaN or NULL?
                return location(this).coords.speed;
            },
        },

        image: {
            get: function(path){
                return assets.images[path(this)];
            },
            drawAtPoint: function(img, pt){
                img(this).drawAtPoint(getContext(), pt(this));
            },
            getWidth: function(img){
                return img(this).getWidth();
            },
            getHeight: function(img){
                return img(this).getHeight();
            },
            setWidth: function(img, w){
                img(this).setWidth(w(this));
            },
            setHeight: function(img, h){
                img(this).setHeight(h(this));
            },
            setSize: function(img, sz){
                img(this).setSize(sz(this));
            },
            scale: function(img, scaleFactor){
                img(this).scale(scaleFactor(this));
            }
        },
        input: {
            keyPressed: function(key){
                if(Event.keys[key(this)])
                    return true;
                else
                    return false;
            },
            mouseX: function(){
                return (Event.pointerX-Event.stage.left);
            },
            mouseY: function(){
                return (Event.pointerY-Event.stage.top);
            },
            mouseDown: function(){
                return Event.pointerDown;
            },
            whenKeyPressed: function(key){
                var self = this;
                var contained = this.contains[0];
                Event.onKeyDown(key(this), function(){
                    contained.forEach(function(block){
                        block.run(self);
                    });
                });
            },
        },

        math: {
            add: function(a,b){
                return util.add(a(this), b(this));
            },
            subtract: function(a,b){
                return util.subtract(a(this), b(this));
            },
            multiply: function(a,b){
                return util.multiply(a(this), b(this));
            },
            divide: function(a,b){
                return util.divide(a(this), b(this));
            },
            equal: function(a,b){
                return util.equal(a(this), b(this));
            },
            notEqual: function(a,b){
                return util.notEqual(a(this), b(this));
            },
            lt: function(a,b){
                return a(this) < b(this);
            },
            lte: function(a,b){
                return a(this) <= b(this);
            },
            gt: function(a,b){
                return a(this) > b(this);
            },
            gte: function(a,b){
                return a(this) >= b(this);
            },
            mod: function(a,b){
                return a(this) % b(this);
            },
            round: function(a){
                return Math.round(a(this));
            },
            abs: function(a){
                return Math.abs(a(this));
            },
            floor: function(a){
                return Math.floor(a(this));
            },
            ceil: function(a){
                return Math.ceil(a(this));
            },
            max: function(a){
            	return Math.max.apply(Math,a(this));
            },
            min: function(a){
            	return Math.min.apply(Math,a(this));
            },
            cos: function(a){
                return Math.cos(util.deg2rad(a(this)));
            },
            sin: function(a){
                return Math.sin(util.deg2rad(a(this)));
            },
            tan: function(a){
                return Math.tan(util.deg2rad(a(this)));
            },
            asin: function(a){
                return Math.asin(util.deg2rad(a(this)));
            },
            acos: function(a){
                return Math.acos(util.deg2rad(a(this)));
            },
            atan: function(a){
                return Math.atan(util.deg2rad(a(this)));
            },
            pow: function(a,b){
                return Math.pow(a(this), b(this));
            },
            sqrt: function(a,b){
                return Math.sqrt(a(this));
            },
            pi: function(){
                return Math.PI;
            },
            e: function(){
                return Math.E;
            },
            tau: function(){
                return Math.PI * 2;
            },
            deg2rad: function(a){
                return util.deg2rad(a(this));
            },
            rad2deg: function(a){
                return util.rad2deg(a(this));
            },
            stringToNumber: function(a){
                return Number(a(this));
            }
        },

        motion: {
            /* Asynchronous update event. Context. */
            /* FIXME: No block for this */
            whenDeviceTurned: function whenDeviceTurnedCtx(direction) {
                var currentScope = this,
                steps = this._contains[0];
                Event.on(window, 'runtime:motionchanged', null, function (event){
                    if (direction === util.motion.direction) {
                        steps.forEach(function (block) {
                            block.run(currentScope);
                        });
                    }
                });
            },
            /* Synchronous "get current location" */
            tiltDirection: function(){
                return util.motion.direction;
            }
        },

        object: {
            empty: function () {
                return {};
            },
            create: function () {
                var i, key, val, obj;
                obj = {};
                // Get key/value pairs from arguments.
                for (i = 0; i < arguments.length; i++) {
                    key = arguments[i][0];
                    val = arguments[i][1];
                    obj[key] = val;
                }
                return obj;
            },
            getValue: function (obj, key) {
                return obj()[key()];
            },
            getKeys: function (obj) {
                return Object.keys(obj());
            }
        },

        path:{

            lineTo: function(toPoint){
                var pt = toPoint();
                return new util.Path(getContext().lineTo, new Array(pt.x, pt.y))
            },

            bezierCurveTo: function(toPoint, controlPoint1, controlPoint2){
                return new util.Path(
                    getContext().bezierCurveTo,
                    new Array(
                        controlPoint1().x, controlPoint1().y,
                        controlPoint2().x, controlPoint2().y,
                        toPoint().x, toPoint().y
                    )
                );
            },
            moveTo: function(toPoint){
                return new util.Path(getContext().moveTo, new Array(toPoint().x, toPoint().y));
            },
            quadraticCurveTo: function(toPoint, controlPoint){
                return new util.Path(
                    getContext().quadraticCurveTo,
                    new Array(
                        controlPoint().x, controlPoint().y,
                        toPoint().x, toPoint().y
                    )
                );
            },
            arcTo: function(radius, controlPoint1, controlPoint2){
                return new util.Path(
                    getContext().arcTo,
                    new Array(
                        controlPoint1().x, controlPoint1().y,
                        controlPoint2().x, controlPoint2().y,
                        radius()
                    )
                );
            },
            closePath: function(){
                return new util.Path(getContext().closePath);
            },
            pathSet: function(){
                return new util.Shape(
                    Array.prototype.slice.call(arguments).map(function(arg){
                        return arg();
                    })
                );
            },

            lineStyle: function(width, color, capStyle, joinStyle){
                getContext().lineWidth = width();
                getContext().strokeStyle = color();
                getContext().lineCap = capStyle();
                getContext().lineJoin = joinStyle();
            }

        },

        random: {
            randFloat: function randFloatExpr(){
                return Math.random();
            },
            randInt: function randIntExpr(start, stop){
                return util.randInt(start(), stop());
            },
            noise: function noiseExpr(x, y, z){
                return util.noise(x(), y(), z());
            },
            choice: function choiceExpr(list){
                return util.choice(list());
            }
        },

        rect: {
            fromCoordinates: function (x, y, width, height) {
                return new util.Rect(x(), y(), width(), height());
            },
            fromVectors: function (point, size) {
                return util.Rect.fromVectors(point(), size());
            },
            fromArray: function (arr) {
                var a = arr();
                if (a.length < 4) {
                    throw new Error('Array must have at least four elements.');
                }
                return new util.Rect(a[0], a[1], a[2], a[3]);
            },
            getPosition: function (rect) {
                return rect().getPosition();
            },
            getSize: function (rect) {
                return rect().getSize();
            },
            asArray: function (r) {
                var rect = r();
                return [rect.x, rect.y, rect.size.width, rect.size.height];
            },
            getX: function (rect) {
                return rect().x;
            },
            getY: function (rect) {
                return rect().y;
            },
            getWidth: function (rect) {
                return rect().size.width;
            },
            getHeight: function (rect) {
                return rect().size.height;
            }
        },

        shape: {
            draw: function(shapeArg){
                shapeArg().draw(getContext());
            },
            fill: function(shapeArg){
                shapeArg().draw(getContext());
                getContext().fill();
            },
            stroke: function(shapeArg){
                shapeArg().draw(getContext());
                getContext().stroke();
            },
            setLineWidth: function(width){
                getContext().lineWidth = width();
            },
            circle: function(pt, rad){
                return new util.Shape(function(ctx){
                    ctx.beginPath();
                    ctx.arc(pt().x, pt().y, rad(), 0, Math.PI * 2, true);
                });
            },
            rectangle: function(p, w, h, orientation){
                var pt = p();
                var width = w();
                var height = h();
                return new util.Shape(function(ctx){
                    ctx.beginPath();
                    if(orientation() == "center"){
                        ctx.moveTo(pt.x - width/2, pt.y - height/2);
                        ctx.lineTo(pt.x + width/2, pt.y - height/2);
                        ctx.lineTo(pt.x + width/2, pt.y + height/2);
                        ctx.lineTo(pt.x - width/2, pt.y + height/2);
                        ctx.lineTo(pt.x - width/2, pt.y - height/2);
                    }
                    else{
                        ctx.moveTo(pt.x, pt.y);
                        ctx.lineTo(pt.x + width, pt.y);
                        ctx.lineTo(pt.x + width, pt.y + height);
                        ctx.lineTo(pt.x, pt.y + height);
                        ctx.lineTo(pt.x, pt.y);
                    }
                });
            },
            ellipse: function(pt, rad1, rad2, rot){
                return new util.Shape(function(ctx){
                    ctx.beginPath();
                    ctx.ellipse(pt().x, pt().y, rad1(), rad2(), rot(), 0, Math.PI * 2);
                });
            },
        },
        size: {
            fromCoordinates: function (width, widthUnits, height, heightUnits) {
                return new util.Size(width(), widthUnits(), height(), heightUnits());
            },
            fromArray: function (a, widthUnits, heightUnits) {
                var arr = a();
                if (arr.length < 2) {
                    throw new Error('Array must have at least two elements.');
                }
                return new util.Size(arr[0], widthUnits(), arr[1], heightUnits());
            },
            toArray: function (size) {
                return [size().width, size().height];
            },
            getWidth: function (size) {
                return size().width;
            },
            getHeight: function (size) {
                return size().height;
            }
        },

        sound: {

            get: function(url){
                return assets.sounds[url()]; // already cached by sounds library
            },
            play: function(sound){
                sound().play();
            },
            setLoop: function(sound, flag){
                sound().loop = flag();
            },
            setVolume: function(sound, volume){
                sound().volume = volume();
            },
            pause: function(sound){
                sound().pause();
            },
            playFrom: function(sound, time){
                sound().playFrom(time());
            },
            pan: function(sound, balance){
                sound().pan = balance();
            },
            echo_DelayFeedbackFilter: function(sound, delay, feedback, filter){
                sound().setEcho(delay(), feedback(), filter());
            },
            stopEcho: function(sound){
                sound().echo = false;
            },
            reverb_DurationDecayReverse: function(sound, duration, decay, reverse){
                sound().setReverb(duration(), decay(), reverse());
            },
            stopReverb: function(sound){
                sound().reverb = false;
            },
            effect: function(frequency, attack, decay, wait, echoDelay, echoFeedback, echoFilter, waveform, volume, balance, pitchBend, reverseBend, random, dissonance){
                return {
                    play: function(){
                        soundEffect(
                            frequency(), attack(), decay(), waveform(),
                            volume(), balance(), wait(),
                            pitchBend(), reverseBend(), random(), dissonance(),
                            [echoDelay(), echoFeedback(), echoFilter()]
                        );
                    }
                };
            }
        },

        sprite: {
            create: function(imgShapeOrSprite){
                return new util.Sprite(imgShapeOrSprite());
            },
            accelerate: function(spt, speed){
                spt().accelerate(speed());
            },
            setVelocity: function(spt, vec){
                spt().setVelocity(vec());
            },
            getVelocity: function spriteGetVelocityExpr(spt){
                return spt().velocity;
            },
            getSpeed: function spriteGetSpeedExpr(spt){
                return spt().velocity.magnitude();
            },
            getXvel: function(spt){
                return spt().getXvel();
            },
            getYvel: function(spt){
                return spt().getYvel();
            },
            getXpos: function(spt){
                return spt().getXpos();
            },
            getYpos: function(spt){
                return spt().getYpos();
            },
            rotate: function(spt, angle){
                spt().rotate(angle());
            },
            rotateTo: function(spt, angle){
                spt().rotateTo(angle());
            },
            move: function(spt){
                spt().move();
            },
            moveTo: function(spt, pt){
                spt().moveTo(pt());
            },
            draw: function(spt){
                spt().draw(getContext());
            },
            applyForce: function(spt, vec){
                spt().applyForce(vec());
            },
            bounceAtEdge: function(spt){
                spt().bounceWithinRect(canvasRect());
            },
            wrapAtEdge: function(spt){
                spt().wrapAroundRect(canvasRect());
            },
            stopAtEdge: function(spt){
                spt().stayWithinRect(canvasRect());
            }
        },
        stage: {
            clearTo: new util.Method()
                .when(['string'], function(clr){ // unfortunately colors are still strings
                    var r = canvasRect();
                    var c = getContext();
                    c.save();
                    c.fillStyle = clr();
                    c.fillRect(r.x, r.y, r.width, r.height);
                    c.restore();
                })
                .when(['wbimage'], function(img){
                    var c = getContext();
                    c.save();
                    img().drawInRect(c, canvasRect());
                    c.restore();
                })
                .when(['shape'], function(shape){
                    var c = getContext();
                    c.save();
                    shape().draw(c);
                    c.restore();
                })
            .fn(),
            stageWidth: function(){
                return Event.stage.width;
            },
            stageHeight: function(){
                return Event.stage.height;
            },
            centerX: function(){
                return (Event.stage.width / 2);
            },
            centerY: function(){
                return (Event.stage.height / 2);
            },
            centerPoint: function(){
                return new util.Vector(Event.stage.width / 2, Event.stage.height / 2);
            },
            randomX: function(){
                return Math.random() * Event.stage.width;
            },
            randomY: function(){
                return Math.random() * Event.stage.height;
            },
        },
        string: {

            toString: function(x){
                return x().toString();
            },
            split: function(x,y){
                return x().split(y);
            },
            concatenate: function(x,y){
                return x().concat(y);
            },
            repeat: function(x,n){
                var str = "";
                for(var i=0; i<n(); i++){
                    str = str.concat(x());
                }
                return str;
            },
            getChar: function(n,x){
                if(n()<0)
                    n = x().length + n();

                return x().charAt(n);
            },
            getCharFromEnd: function(n,x){
                if(n()<=0)
                    n = n()*(-1)-1;
                else
                    n = x().length-n;
                return x().charAt(n);
            },
            substring: function(x,a,b){
                if(a()<0)
                    return "";
                else
                    return x().substring(a(),a()+b());
            },
            substring2: function(x,a,b){
                if(a()<0 || a()>x().length)
                    return "";
                else
                    return x().substring(a(),b());
            },
            isSubstring: function(x,y){
                if(y().indexOf(x())===-1){
                    return false;
                }
                else{
                    return true;
                }
            },
            substringPosition: function(x,y){
                return y().indexOf(x());
            },
            replaceSubstring: function(x,y,z){
                return x().replace(new RegExp(y(), 'g'), z());
            },
            trimWhitespace: function(x){
                return x().trim();
            },
            uppercase: function(x){
                return x().toUpperCase();
            },
            lowercase: function(x){
                return x().toLowerCase();
            },
            matches: function(x,y){
                return x()===y();
            },
            doesntMatch: function(x,y){
                return !(x()===y());
            },
            startsWith: function(x,y){
                return (x().lastIndexOf(y(), 0) === 0);
            },
            endsWith: function(x,y){
                return x().indexOf(y(), x().length - y().length) !== -1;
            },
            setFont: function (size, fontStyle){
                var sizeString = size()[0] + size()[1];
                getContext().font = sizeString + " " + fontStyle();

            },
            textAlign: function (alignment){
                getContext().textAlign = alignment();
            },
            textBaseline: function (baseline){
                getContext().textBaseline = baseline();
            },
            fillText: function (text, x, y){
                getContext().fillText(text(), x(), y());
            },
            fillTextWidth: function (text, x, y, width){
                getContext().fillText(text(), x(), y(), width());
            },
            strokeText: function (text, x, y){
                getContext().strokeText(text(), x(), y());
            },
            strokeTextWidth: function (text, x, y, width){
                getContext().strokeText(text(), x(), y(), width());
            },
            width: function (text){
                var textMetric = getContext().measureText(text());
                return textMetric.width;
            }
        },
        vector: {
            create: function create(x,y){
                return new util.Vector(x(),y());
            },
            createPolar: function createPolar(deg, mag){
                return util.Vector.fromPolar(deg(), mag());
            },
            fromArray: function fromArray(arr){
                return new util.Vector(arr()[0], arr()[1]);
            },
            toArray: function toArray(vec){
                return [vec().x, vec().y];
            },
            randomPoint: function randomPoint(){
                return new util.Vector(util.randInt(Event.stage.width), util.randInt(Event.stage.height));
            },
            unitVector: function unitVector(){
                return new util.Vector(1,1);
            },
            zeroVector: function zeroVector(){
                return new util.Vector(0,0);
            },
            rotateTo: function rotateTo(vec, deg){
                return vec().rotateTo(deg());
            },
            rotate: function rotate(vec, deg){
                return vec().rotate(deg());
            },
            magnitude: function magnitude(vec){
                return vec().magnitude();
            },
            degrees: function degrees(vec){
                return vec().degrees();
            },
            normalize: function normalize(vec){
                return vec().normalize();
            },
            x: function x(vec){
                return vec().x;
            },
            y: function y(vec){
                return vec().y;
            },
            randomUnitVector: function randomUnitVector(){
                var vec = util.Vector.fromPolar(Math.random() * 360, 1);
                return vec;
            }
        },
        date: {
            create: function (year, month, day) {
                return new Date(year(), month()-1, day());
            },
            now: function () {
                var today = new Date();
                // Seems like "now" should have time as well, but
                // maybe "today" shouldn't?
                today.setHours(0, 0, 0, 0)
                return today;
            },
            addDays: function (prevDate, days) {
                // we don't want to mutate an argument in place
                var date = new Date(prevDate().valueOf()); // clone argument
                date.setDate(prevDate.getDate() + days());
                return date;
            },
            addMonths: function (prevDate, months) {
                var date = new Date(prevDate().valueOf());
                date.setMonth(date.getMonth() + months());
                return date;
            },
            addYears: function (prevDate, years) {
                var date = new Date(prevDate().valueOf());
                date.setFullYear(date.getFullYear() + years());
                return date;
            },
            dayOfWeek: function(date) {
                var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return days[date().getDay()];
            },
            getDay: function(date) {
                return date().getDate();
            },
            getMonth: function(date) {
                return date().getMonth()+1;
            },
            getMonthName: function(date) {
                var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                              'August', 'September', 'October', 'November', 'December'];
                return months[date().getMonth()];
            },
            getYear: function(date) {
                return date().getFullYear();
            },
            formattedDate: function(date) {
                return date().toLocaleDateString();
            }
        }
    };


})(window);
