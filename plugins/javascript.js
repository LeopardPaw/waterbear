/* 
 *    JAVASCRIPT PLUGIN
 * 
 *    Support for writing Javascript using Waterbear
 *
 */

(function(){


// Pre-load dependencies
yepnope({
    load: [ 'plugins/javascript.css',
            'lib/beautify.js',
            'lib/highlight.js',
            'lib/highlight-javascript.js',
            'lib/highlight-github.css'
    ]
});

// Add some utilities
jQuery.fn.extend({
    prettyScript: function(){
      return js_beautify(this.map(function(){ return $(this).extract_script();}).get().join(''));
    },
    writeScript: function(view){
      view.html('<pre class="language-javascript">' + this.prettyScript() + '</pre>');
      hljs.highlightBlock(view.children()[0]);
    },
    wrapScript: function(){
        // wrap the top-level script to prevent leaking into globals
        var script = this.prettyScript();
        var retval = 'var global = new Global();(function($){var local = new Local();try{' + script + '}catch(e){alert(e);}})(jQuery);';
        //console.log(retval);
        return retval;
    }
});

// End UI section

// expose these globally so the Block/Label methods can find them
window.choiceLists = {
    keys: 'abcdefghijklmnopqrstuvwxyz0123456789*+-./'
        .split('').concat(['up', 'down', 'left', 'right',
        'backspace', 'tab', 'return', 'shift', 'ctrl', 'alt', 
        'pause', 'capslock', 'esc', 'space', 'pageup', 'pagedown', 
        'end', 'home', 'insert', 'del', 'numlock', 'scroll', 'meta']),
    blocktypes: ['step', 'expression', 'context', 'eventhandler'],
    types: ['string', 'number', 'boolean', 'array', 'object', 'function', 'any'],
    rettypes: ['none', 'string', 'number', 'boolean', 'array', 'object', 'function', 'any']
};

// Hints for building blocks
//
//
// Value blocks can nest, so don't end them with semi-colons (i.e., if there is a "type" specified).
//
//

// MENUS

menu('Control', [
    {
        blocktype: 'eventhandler',
        contained: [{label: 'when program runs'}],
        script: 'function _start(){[[1]]}_start();',
        help: 'this trigger will run its scripts once when the program starts'
    },
    {
        blocktype: 'eventhandler',
        contained: [{label: 'when [choice:keys] key pressed'}],
        script: '$(document).bind("keydown", {{1}}, function(){[[1]]; return false;});',
        help: 'this trigger will run the attached blocks every time this key is pressed'
    },
    {            
        blocktype: 'eventhandler',
        contained: [{label: 'repeat [number:30] times a second'}],
        locals: [
            {
                blocktype: 'expression',
                label: 'count##',
                script: 'local.count##',
                type: 'number'
            }
        ],
        script: '(function(){setInterval(function(){local.count##++;[[1]]},1000/{{1}})})();',
        help: 'this trigger will run the attached blocks periodically'
    },
    {
        blocktype: 'context',
        contained: [{label: 'wait [number:1] secs'}],
        script: 'setTimeout(function(){[[1]]},1000*{{1}});',
        help: 'pause before running the following blocks'
    },
    {
        blocktype: 'context',
        contained: [{label: 'repeat [number:10]'}], 
        script: 'range({{1}}).forEach(function(idx, item){local.count## = idx;[[1]]});',
        help: 'repeat the contained blocks so many times',
        locals: [
            {
                blocktype: 'expression',
                label: 'count##',
                script: 'local.count##',
                type: 'number'
            }
        ]
    },
    {
        blocktype: 'step',
        label: 'broadcast [string:ack] message', 
        script: '$(".stage").trigger({{1}});',
        help: 'send this message to any listeners'
    },
    {
        blocktype: 'eventhandler',
        contained: [{label: 'when I receive [string:ack] message'}],
        script: '$(".stage").bind({{1}}, function(){[[1]]});',
        help: 'add a listener for the given message, run these blocks when it is received'
    },
    {
        blocktype: 'context',
        contained: [{label: 'forever if [boolean:false]'}],  
        script: 'while({{1}}){[[1]]}',
        help: 'repeat until the condition is false'
    },
    {
        blocktype: 'context',
        contained: [{label: 'if [boolean]'}], 
        script: 'if({{1}}){[[1]]}',
        help: 'run the following blocks only if the condition is true'
    },
    {
        blocktype: 'context',
        contained: [{label: 'if [boolean]'}, {label: 'else'}],
        script: 'if({{1}}){[[1]]}else{[[2]]}',
        help: 'run the first set of blocks if the condition is true, otherwise run the second set'
    },
    {
        blocktype: 'context',
        contained: [{label: 'repeat until [boolean]'}], 
        script: 'while(!({{1}})){[[1]]}',
        help: 'repeat forever until condition is true'
    },
    {
        blocktype: 'step',
        label: 'variable string## [string]',
        script: 'local.string## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'string##',
            script: 'local.string##',
            type: 'string'
        },
        help: 'create a reference to re-use the string'
    },
    {
        blocktype: 'step',
        label: 'variable number## [number]',
        script: 'local.number## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'number##',
            script: 'local.number##',
            type: 'number'
        },
        help: 'create a reference to re-use the number'
    },
    {
        blocktype: 'step',
        label: 'variable boolean## [boolean]',
        script: 'local.boolean## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'boolean##',
            script: 'local.boolean##',
            type: 'boolean'
        },
        help: 'create a reference to re-use the boolean'
    },
    {
        blocktype: 'step',
        label: 'variable array## [array]',
        script: 'local.array## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'array##',
            script: 'local.array## = {{1}}',
            type: 'array'
        },
        help: 'create a reference to re-use the array'
    },
    {
        blocktype: 'step',
        label: 'variable object## [object]',
        script: 'local.object## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'object##',
            script: 'local.object##',
            type: 'object'
        },
        help: 'create a reference to re-use the object'
    },
    {
        blocktype: 'step',
        label: 'variable color## [color]',
        script: 'local.color## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'color##',
            script: 'local.color##',
            type: 'color'
        },
        help: 'create a reference to re-use the color'
    },
    {
        blocktype: 'step',
        label: 'variable image## [image]',
        script: 'local.image## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'image##',
            script: 'local.image##',
            type: 'image'
        },
        help: 'create a reference to re-use the image'
    },
    // 'shape', 'point', 'size', 'rect', 'gradient', 'pattern', 'imagedata', 'any'
    {
        blocktype: 'step',
        label: 'variable shape## [shape]',
        script: 'local.shape## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'shape##',
            script: 'local.shape##',
            type: 'shape'
        },
        help: 'create a reference to re-use the shape'
    },
    {
        blocktype: 'step',
        label: 'variable point## [point]',
        script: 'local.point## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'point##',
            script: 'local.point##',
            type: 'point'
        },
        help: 'create a reference to re-use the point'
    },
    {
        blocktype: 'step',
        label: 'variable size## [size]',
        script: 'local.size## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'size##',
            script: 'local.size##',
            type: 'size'
        },
        help: 'create a reference to re-use the size'
    },
    {
        blocktype: 'step',
        label: 'variable rect## [rect]',
        script: 'local.rect## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'rect##',
            script: 'local.rect##',
            type: 'rect'
        },
        help: 'create a reference to re-use the rect'
    },
    {
        blocktype: 'step',
        label: 'variable gradient## [gradient]',
        script: 'local.gradient## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'gradient##',
            script: 'local.gradient##',
            type: 'gradient'
        },
        help: 'create a reference to re-use the gradient'
    },
    {
        blocktype: 'step',
        label: 'variable pattern## [pattern]',
        script: 'local.pattern## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'pattern##',
            script: 'local.pattern##',
            type: 'pattern'
        },
        help: 'create a reference to re-use the pattern'
    },
    {
        blocktype: 'step',
        label: 'variable imagedata## [imagedata]',
        script: 'local.imagedata## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'imagedata##',
            script: 'local.imagedata##',
            type: 'imagedata'
        },
        help: 'create a reference to re-use the imagedata'
    },
    {
        blocktype: 'step',
        label: 'variable any## [any]',
        script: 'local.any## = {{1}};',
        returns: {
            blocktype: 'expression',
            label: 'any##',
            script: 'local.any##',
            type: 'any'
        },
        help: 'create a reference to re-use the any'
    },
], false);

menu('User Defined', [
    {
        blocktype: 'context',
        contained: [
            {label: 'New [choice:blocktype] with arguments:'},
            {label: 'And body returning [any]'}
        ],
        script: 'var block## = newBlockHandler([{{1}}],[{{2}}])',
        help: 'Create a new block for re-use',
        returns: 'block'
    },
    {
        blocktype: 'context',
        contained: [
            {label: 'New [choice:blocktypes] with arg1 [choice:types]'}
        ],
        script: 'alert("implement me");',
        help: 'Create a new block for re-use'
    },
    {
        blocktype: 'context',
        contained: [
            {label: 'New [choice:blocktypes] with arg1 [choice:types] returns [choice:rettypes]'}
        script: '',
        help: ''
    }
]);

menu('Arrays', [
    {
        blocktype: 'step',
        label: 'new array##',
        script: 'local.array## = [];',
        help: 'Create an empty array',
        returns: {
            blocktype: 'expression',
            label: 'array##',
            script: 'local.array##',
            type: 'array'
        }
    },
    {
        blocktype: 'step',
        label: 'new array with array## [array]',
        script: 'local.array## = {{1}}.slice();',
        help: 'create a new array with the contents of another array',
        returns: {
            blocktype: 'expression',
            label: 'array##',
            script: 'local.array##',
            type: 'array'
        }
    },
    {
        blocktype: 'expression',
        label: 'array [array] item [number:0]',
        script: '{{1}}[{{2}}]',
        type: 'any',
        help: 'get an item from an index in the array'
    },
    {
        blocktype: 'expression',
        label: 'array [array] join with [string:, ]',
        script: '{{1}}.join({{2}})',
        type: 'string',
        help: 'join items of an array into a string, each item separated by given string'
    },
    {
        blocktype: 'step',
        label: 'array [array] append [any]',
        script: '{{1}}.push({{2}});',
        help: 'add any object to an array'
    },
    {
        blocktype: 'expression',
        label: 'array [array] length',
        script: '{{1}}.length',
        type: 'number',
        help: 'get the length of an array'
    },
    {
        blocktype: 'expression',
        label: 'array [array] remove item [number:0]',
        script: '{{1}}.splice({{2}}, 1)[0]',
        type: 'any',
        help: 'remove item at index from an array'
    },
    {
        blocktype: 'expression',
        label: 'array [array] pop',
        script: '{{1}}.pop()',
        type: 'any',
        help: 'remove and return the last item from an array'
    },
    {
        blocktype: 'expression',
        label: 'array [array] shift',
        script: '{{1}}.shift()',
        type: 'any',
        help: 'remove and return the first item from an array'
    },
    {   
        blocktype: 'expression',
        label: 'array [array] reversed',
        script: '{{1}}.slice().reverse()',
        type: 'array',
        help: 'reverse a copy of array'
    },
    {
        blocktype: 'expression',
        label: 'array [array] concat [array]',
        script: '{{1}}.concat({{2}});',
        type: 'array',
        help: 'a new array formed by joining the arrays'
    },
    {
        blocktype: 'context',
        contained: [{label: 'array [array] for each'}],
        script: '$.each({{1}}, function(idx, item){local.index = idx; local.item = item; [[1]] });',
        locals: [
            {
                blocktype: 'expression',
                label: 'index',
                script: 'local.index',
                help: 'index of current item in array',
                type: 'number'
            },
            {
                blocktype: 'expression',
                label: 'item',
                script: 'local.item',
                help: 'the current item in the iteration',
                type: 'any'
            }
        ],
        help: 'run the blocks with each item of a named array'
    }
], false);

menu('Objects', [
    {
        blocktype: 'step',
        label: 'new object##',
        script: 'local.object## = {};',
        returns: {
            blocktype: 'expression',
            label: 'object##',
            script: 'local.object##',
            type: 'object'
        },
        help: 'create a new, empty object'
    },
    {
        blocktype: 'step',
        label: 'object [object] key [string] = value [any]',
        script: '{{1}}[{{2}}] = {{3}};',
        help: 'set the key/value of an object'
    },
    {
        blocktype: 'expression',
        label: 'object [object] value at key [string]',
        script: '{{1}}[{{2}}]',
        type: 'any',
        help: 'return the value of the key in an object'
    },
    {
        blocktype: 'context',
        contained: [{label: 'for each item in [object] do'}],
        script: '$.each({{1}}, function(key, item){local.key = key; local.item = item; [[1]] });',
        locals: [
            {
                blocktype: 'expression',
                label: 'key',
                script: 'local.key',
                help: 'key of current item in object',
                type: 'string'
            },
            {
                blocktype: 'expression',
                label: 'item',
                script: 'local.item',
                help: 'the current item in the iteration',
                type: 'any'
            }
        ],
        help: 'run the blocks with each item of a object'
        
    }
], false);

menu('Strings', [
    {
        blocktype: 'expression',
        label: 'string [string] split on [string]',
        script: '{{1}}.split({{2}})',
        type: 'array',
        help: 'create an array by splitting the named string on the given string'
    },
    {
        blocktype: 'expression',
        label: 'string [string] character at [number:0]',
        script: '{{1}}[{{2}}]',
        type: 'string',
        help: 'get the single character string at the given index of named string'
    },
    {
        blocktype: 'expression',
        label: 'string [string] length',
        script: '{{1}}.length',
        type: 'number',
        help: 'get the length of named string'
    },
    {
        blocktype: 'expression',
        label: 'string [string] indexOf [string]',
        script: '{{1}}.indexOf({{2}})',
        type: 'number',
        help: 'get the index of the substring within the named string'
    },
    {
        blocktype: 'expression',
        label: 'string [string] replace [string] with [string]',
        script: '{{1}}.replace({{2}}, {{3}})',
        type: 'string',
        help: 'get a new string by replacing a substring with a new string'
    },
    {
        blocktype: 'expression',
        label: 'to string [any]',
        script: '{{1}}.toString()',
        type: 'string',
        help: 'convert any object to a string'
    },
    {
        blocktype: 'step',
        label: 'comment [string]',
        script: '// {{1}};\n',
        help: 'this is a comment and will not be run by the program'
    },
    {
        blocktype: 'step',
        label: 'alert [string]',
        script: 'window.alert({{1}});',
        help: 'pop up an alert window with string'
    },
    {
        blocktype: 'step',
        label: 'console log [any]',
        script: 'console.log({{1}});',
        help: 'Send any object as a message to the console'
    },
    {
        blocktype: 'step',
        label: 'console log format [string] arguments [array]',
        script: 'var __a={{2}};__a.unshift({{1}});console.log.apply(console, __a);',
        help: 'send a message to the console with a format string and multiple objects'
    }
], false);

menu('Sensing', [
    {
        blocktype: 'step',
        label: 'ask [string:What\'s your name?] and wait',
        script: 'local.answer## = prompt({{1}});',
        returns: {
            blocktype: 'expression',
            label: 'answer##',
            type: 'string',
            script: 'local.answer'
        },
        help: 'Prompt the user for information'
    },
    {
        blocktype: 'expression',
        label: 'mouse x', 
        type: 'number', 
        script: 'global.mouse_x',
        help: 'The current horizontal mouse position'
    },
    {
        blocktype: 'expression',
        label: 'mouse y', 
        type: 'number', 
        script: 'global.mouse_y',
        help: 'the current vertical mouse position'
    },
    {
        blocktype: 'expression',
        label: 'mouse down', 
        type: 'boolean', 
        script: 'global.mouse_down',
        help: 'true if the mouse is down, false otherwise'
    },
    {
        blocktype: 'expression',
        label: 'key [choice:keys] pressed?', 
        type: 'boolean', 
        script: '$(document).bind("keydown", {{1}}, function(){[[1]]});',
        help: 'is the given key down when this block is run?'
    },
    {
        blocktype: 'expression',
        label: 'stage width', 
        type: 'number', 
        script: 'global.stage_width',
        help: 'width of the stage where scripts are run. This may change if the browser window changes'
    },
    {
        blocktype: 'expression',
        label: 'stage height', 
        type: 'number', 
        script: 'global.stage_height',
        help: 'height of the stage where scripts are run. This may change if the browser window changes.'
    },
    {
        blocktype: 'expression',
        label: 'center x', 
        type: 'number', 
        script: 'global.stage_center_x',
        help: 'horizontal center of the stage'
    },
    {
        blocktype: 'expression',
        label: 'center y', 
        type: 'number', 
        script: 'global.stage_center_y',
        help: 'vertical center of the stage'
    },
    {
        blocktype: 'step',
        label: 'reset timer', 
        script: 'global.timer.reset();',
        help: 'set the global timer back to zero'
    },
    {
        blocktype: 'expression',
        label: 'timer', 
        type: 'number', 
        script: 'global.timer.value()',
        help: 'seconds since the script began running'
    }
]);

menu('Operators', [
    {
        blocktype: 'expression',
        label: '[number:0] + [number:0]', 
        type: 'number', 
        script: "({{1}} + {{2}})",
        help: 'sum of the two operands'
    },
    {
        blocktype: 'expression',
        label: '[number:0] - [number:0]', 
        type: 'number', 
        script: "({{1}} - {{2}})",
        help: 'difference of the two operands'
    },
    {
        blocktype: 'expression',
        label: '[number:0] * [number:0]', 
        type: 'number', 
        script: "({{1}} * {{2}})",
        help: 'product of the two operands'
    },
    {
        blocktype: 'expression',
        label: '[number:0] / [number:0]',
        type: 'number', 
        script: "({{1}} / {{2}})",
        help: 'quotient of the two operands'
    },
    {
        blocktype: 'expression',
        label: 'pick random [number:1] to [number:10]', 
        type: 'number', 
        script: "randint({{1}}, {{2}})",
        help: 'random number between two numbers (inclusive)'
    },
    {
        blocktype: 'expression',
        label: '[number:0] < [number:0]', 
        type: 'boolean', 
        script: "({{1}} < {{2}})",
        help: 'first operand is less than second operand'
    },
    {
        blocktype: 'expression',    
        label: '[number:0] = [number:0]', 
        type: 'boolean', 
        script: "({{1}} === {{2}})",
        help: 'two operands are equal'
    },
    {
        blocktype: 'expression',
        label: '[number:0] > [number:0]', 
        type: 'boolean', 
        script: "({{1}} > {{2}})",
        help: 'first operand is greater than second operand'
    },
    {
        blocktype: 'expression',
        label: '[boolean] and [boolean]', 
        type: 'boolean', 
        script: "({{1}} && {{2}})",
        help: 'both operands are true'
    },
    {
        blocktype: 'expression',
        label: '[boolean] or [boolean]', 
        type: 'boolean', 
        script: "({{1}} || {{2}})",
        help: 'either or both operands are true'
    },
    {
        blocktype: 'expression',
        label: '[boolean] xor [boolean]',
        type: 'boolean',
        script: "({{1}} ? !{{2}} : {{2}})",
        help: 'either, but not both, operands are true'
    },
    {
        blocktype: 'expression',
        label: 'not [boolean]', 
        type: 'boolean', 
        script: "(! {{1}})",
        help: 'operand is false',
    },
    {
        blocktype: 'expression',
        label: 'concatenate [string:hello] with [string:world]', 
        type: 'string', 
        script: "({{1}} + {{2}})",
        help: 'returns a string by joining together two strings'
    },
    {
        blocktype: 'expression',
        label: '[number:0] mod [number:0]', 
        type: 'number', 
        script: "({{1}} % {{2}})",
        help: 'modulus of a number is the remainder after whole number division'
    },
    {
        blocktype: 'expression',
        label: 'round [number:0]', 
        type: 'number', 
        script: "Math.round({{1}})",
        help: 'rounds to the nearest whole number'
    },
    {
        blocktype: 'expression',
        label: 'absolute of [number:10]', 
        type: 'number', 
        script: "Math.abs({{2}})",
        help: 'converts a negative number to positive, leaves positive alone'
    },
    {
        blocktype: 'expression',
        label: 'arccosine degrees of [number:10]', 
        type: 'number', 
        script: 'rad2deg(Math.acos({{1}}))',
        help: 'inverse of cosine'
    },
    {
        blocktype: 'expression',
        label: 'arcsine degrees of [number:10]', 
        type: 'number', 
        script: 'rad2deg(Math.asin({{1}}))',
        help: 'inverse of sine'
    },
    {
        blocktype: 'expression',
        label: 'arctangent degrees of [number:10]', 
        type: 'number', 
        script: 'rad2deg(Math.atan({{1}}))',
        help: 'inverse of tangent'
    },
    {
        blocktype: 'expression',
        label: 'ceiling of [number:10]', 
        type: 'number', 
        script: 'Math.ceil({{1}})',
        help: 'rounds up to nearest whole number'
    },
    {
        blocktype: 'expression',
        label: 'cosine of [number:10] degrees', 
        type: 'number', 
        script: 'Math.cos(deg2rad({{1}}))',
        help: 'ratio of the length of the adjacent side to the length of the hypotenuse'
    },
    {
        blocktype: 'expression',
        label: 'sine of [number:10] degrees', 
        type: 'number', 
        script: 'Math.sin(deg2rad({{1}}))',
        help: 'ratio of the length of the opposite side to the length of the hypotenuse'
    },
    {
        blocktype: 'expression',
        label: 'tangent of [number:10] degrees', 
        type: 'number', 
        script: 'Math.tan(deg2rad({{1}}))',
        help: 'ratio of the length of the opposite side to the length of the adjacent side'
    },
    {
        blocktype: 'expression',
        label: '[number:10] to the power of [number:2]', 
        type: 'number', 
        script: 'Math.pow({{1}}, {{2}})',
        help: 'multiply a number by itself the given number of times'
    },
    {
        blocktype: 'expression',
        label: 'square root of [number:10]', 
        type: 'number', 
        script: 'Math.sqrt({{1}})',
        help: 'the square root is the same as taking the to the power of 1/2'
    },
    {
        blocktype: 'expression',
        label: 'pi',
        script: 'Math.PI;',
        type: 'number',
        help: "pi is the ratio of a circle's circumference to its diameter"
    },
    {
        blocktype: 'expression',
        label: 'tau',
        script: 'Math.PI * 2',
        type: 'number',
        help: 'tau is 2 times pi, a generally more useful number'
    }
]);

var demos = [];
populateDemosDialog(demos);
loadCurrentScripts();
$('.scripts_workspace').trigger('init');

$('.socket input').live('click',function(){
    $(this).focus();
    $(this).select();
});

})();
