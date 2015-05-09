/*!
 * concat.js v0.9.5, https://github.com/hoho/concat.js
 * (c) 2013-2014 Marat Abdullin, MIT license
 */

(function(window, undefined) {
    // This code is being optimized for size, so some parts of it could be
    // a bit hard to read. But it is quite short anyway.
    var document = window.document,
        tags = 'div|span|p|a|ul|ol|li|table|tr|td|th|br|img|b|i|s|u'.split('|'),
        proto,
        i,
        curArgs = [],
        eachTarget,
        isFunction =
            function(func) {
                return typeof func === 'function';
            },

        blockFunc =
            function(prop, defaultValue) {
                return function(arg) {
                    var self = this,
                        item = Item(self);

                    item[prop] = arg === undefined ? defaultValue : arg;

                    self.c = item;

                    return self;
                };
            },

        constr =
            function(parent, replace, direct) {
                // Item:
                // D — node to append the result to (if any).
                // P — item's parent node.
                // A — item's parent item.
                // F — a function to call before processing subitems.
                // R — how many times to repeat this item.
                // E — an array for each().
                // T — test expression (for conditional subtree processing).
                // _ — subitems.
                // e — redefinition for end() return value.

                // self.c — current item.
                // self._ — first item.

                var self = this;

                self._ = self.c = {
                    D: parent && {p: parent, r: replace},
                    P: parent && ((self.d = direct)) ? parent : document.createDocumentFragment(),
                    _: []
                };
            },

        run =
            function(item) {
                var R,
                    i,
                    j,
                    oldArgs = curArgs,
                    oldEachTarget = eachTarget,
                    keys,
                    position = -1;

                if (item.E !== undefined) {
                    eachTarget = isFunction(item.E) ?
                        item.E.apply(item.A.P, curArgs)
                        :
                        item.E;

                    if (eachTarget) {
                        keys = [];
                        if (eachTarget instanceof Array) {
                            for (j = 0; j < eachTarget.length; j++) {
                                keys.push(j);
                            }
                        } else {
                            for (j in eachTarget) {
                                keys.push(j);
                            }
                        }

                        curArgs = [undefined, undefined, eachTarget];

                        R = function() {
                            curArgs[0] = eachTarget[(curArgs[1] = keys[++position])];
                            return position < keys.length;
                        };
                    }
                } else if (item.R !== undefined) {
                    curArgs = [-1];
                    eachTarget = undefined;

                    R = function() {
                        return isFunction(item.R) ?
                            item.R.call(item.A.P, ++curArgs[0])
                            :
                            ++curArgs[0] < item.R;
                    };
                } else {
                    i = isFunction(item.T) ?
                        (item.T.apply(item.A.P, curArgs) ? 1 : 0)
                        :
                        (item.T === undefined) || item.T ? 1 : 0;
                }

                while ((!R && i--) || (R && R())) {
                    if (R || item.T) {
                        item.P = item.A.P;
                    }

                    item.F && item.F();

                    for (j = 0; j < item._.length; j++) {
                        run(item._[j]);
                    }
                }

                curArgs = oldArgs;
                eachTarget = oldEachTarget;
            },

        Item =
            function(self, func, /**/ret) {
                ret = {
                    A: self.c,
                    F: func,
                    _: []
                };

                self.c._.push(ret);

                return ret;
            };

    proto = constr.prototype;

    proto.end = function(num) {
        var self = this,
            r,
            ret;

        if (num === undefined) { num = 1; }

        while (num > 0 && ((ret = self.c.e), (self.c = self.c.A))) {
            num--;
        }

        if (self.c) { return ret || self; }

        r = self._;

        run(r);

        if ((i = r.D)) {
            if (i.r) {
                i.p.innerHTML = '';
            }

            if (!self.d) {
                // It's a direct rendering, everything is already there.
                i.p.appendChild(r.P);
            }
        } else {
            return r.P;
        }
    };

    proto.elem = function(name, attr, close) {
        var self = this,
            item = Item(self, function(elem/**/, a, prop, val, tmp, attrVal) {
                elem = item.P = document.createElement(
                    isFunction(name) ? name.apply(item.A.P, curArgs) : name
                );

                attrVal = isFunction(attr) ? attr.apply(elem, curArgs) : attr;

                for (var i in attrVal) {
                    if (isFunction((a = attrVal[i]))) {
                        a = a.apply(elem, curArgs);
                    }

                    if (a !== undefined) {
                        if (i === 'style') {
                            if (typeof a === 'object') {
                                val = [];

                                for (prop in a) {
                                    if (isFunction((tmp = a[prop]))) {
                                        tmp = tmp.apply(elem, curArgs);
                                    }

                                    if (tmp !== undefined) {
                                        val.push(prop + ': ' + tmp);
                                    }
                                }

                                a = val.join('; ');
                            }

                            if (a) {
                                elem.style.cssText = a;
                            }
                        } else {
                            elem.setAttribute(i, a);
                        }
                    }
                }

                item.A.P.appendChild(elem);
            });

        self.c = item;

        // attr argument is optional, if it strictly equals to true,
        // use it as close, when close is not passed.
        return close || (close === undefined && attr === true) ?
            self.end()
            :
            self;
    };

    proto.mem = function(key, func) {
        var self = this,
            item = Item(self, function(/**/parentElem) {
                parentElem = item.A.P;
                window.$C.mem[isFunction(key) ? key.apply(parentElem, curArgs) : key] =
                    isFunction(func) ? func.apply(parentElem, curArgs) : func || parentElem;
            });

        return self;
    };

    proto.repeat = blockFunc('R', 0);
    proto.each = blockFunc('E', []);
    proto.test = blockFunc('T', false);
    proto.choose = function() {
        var self = this,
            item = Item(self, function() { skip = undefined; }),
            skip,
            choose = {},
            condFunc = function(isOtherwise/**/, val) {
                return function(test) {
                    val = blockFunc('T').call(self, function() {
                        return (!skip && (isOtherwise || (isFunction(test) ? test.apply(item.A.P, curArgs) : test))) ?
                            (skip = true)
                            :
                            false;
                    });
                    val.c.e = choose;
                    return val;
                };
            };

        item.T = true;
        self.c = item;

        choose.when = condFunc();
        choose.otherwise = condFunc(true);
        choose.end = function(num) { return proto.end.call(self, num); };

        return choose;
    };

    // Shortcuts for popular tags, to use .div() instead of .elem('div').
    for (i = 0; i < tags.length; i++) {
        proto[tags[i]] = (function(name) {
            return function(attr, close) {
                return this.elem(name, attr, close);
            };
        })(tags[i]);
    }

    window.$C = i = function(parent, replace, direct) {
        return new constr(parent, replace, direct);
    };

    i.mem = {};

    i.define = i = function(name, func) {
        proto[name] = function() {
            var args = arguments,
                item = Item(this, function() {
                    func.call(item.A.P, curArgs[0], curArgs[1], curArgs[2], args);
                });

            return this;
        };
    };

    // We're inside and we have an access to curArgs variable which is
    // [index, item], so we will use curArgs to shorten the code.
    i('act', function(item, index, arr, args) {
        args[0].apply(this, curArgs);
    });

    i('text', function(item, index, arr, args/**/, text, el) {
        text = args[0];
        text = isFunction(text) ? text.apply(this, curArgs) : text;

        if (text !== undefined) {
            if (args[1]) {
                el = document.createElement('p');
                el.innerHTML = text;
                el = el.firstChild;
                while (el) {
                    // Use text variable as a temporary variable.
                    text = el.nextSibling;
                    this.appendChild(el);
                    el = text;
                }
            } else {
                this.appendChild(document.createTextNode(text));
            }
        }

    });

    i('attr', function(item, index, arr, args/**/, self, name, val) {
        (self = this).setAttribute(
            isFunction((name = args[0])) ? name.call(self, item, index, arr) : name,
            isFunction((val = args[1])) ? val.call(self, item, index, arr) : val
        );
    });
})(window);


// Conkitty common functions.
(function($C, window) {

    $C.tpl = {};
    $C._tpl = {};


    var Node = window.Node,
        $ConkittyEventHandlers = [],
        whitespace = /[\x20\t\r\n\f]/;

    $C.on = function on(callback) {
        $ConkittyEventHandlers.push(callback);
    };

    $C.off = function off(callback) {
        if (callback) {
            var i = $ConkittyEventHandlers.length - 1;

            while (i >= 0) {
                if ($ConkittyEventHandlers[i] === callback) {
                    $ConkittyEventHandlers.splice(i, 1);
                } else {
                    i--;
                }
            }
        } else {
            $ConkittyEventHandlers = [];
        }
    };

    $C.define('trigger', function (val, key, obj, args) {
        var i,
            arg;

        for (i = 0; i < args.length; i++) {
            if (typeof ((arg = args[i])) === 'function') {
                args[i] = arg.call(this, val, key, obj);
            }
        }

        for (i = 0; i < $ConkittyEventHandlers.length; i++) {
            $ConkittyEventHandlers[i].apply(this, args);
        }
    });


    function EnvClass(parent, payload) {
        this.p = parent;
        this.d = payload;
    }

    EnvClass.prototype.l = function getPayload(parent) {
        var self = this,
            ret;

        if (self.d) {
            // Trying to get cached payload.
            if (!((ret = self._p))) {
                ret = self._p = self.d();
            }

            if (!parent) {
                return ret.firstChild ? ret : undefined;
            }

            ret && parent.appendChild(ret);
            delete self._p;
        }
    };


    $C._$args = [
        $C,

        EnvClass,

        function getEnv(obj) {
            return obj instanceof EnvClass ? obj : new EnvClass(obj instanceof Node ? obj : undefined);
        },

        function joinClasses() {
            var i, ret = [], arg;
            for (i = 0; i < arguments.length; i++) {
                if ((arg = arguments[i])) {
                    ret.push(arg);
                }
            }
            return ret.length ? ret.join(' ') : undefined;
        },

        function getModClass(name, val) {
            if (val) {
                return val === true ? name : name + '_' + val;
            }
        },

        function getChangedClass(node, classes, remove) {
            var cur = (node.getAttribute('class') || '').split(whitespace),
                change = (classes || '').split(whitespace),
                i,
                curObj = {};

            for (i = 0; i < cur.length; i++) {
                curObj[cur[i]] = true;
            }

            for (i = 0; i < change.length; i++) {
                if (remove) {
                    delete curObj[change[i]];
                } else {
                    curObj[change[i]] = true;
                }
            }

            cur = [];
            for (i in curObj) {
                cur.push(i);
            }

            return cur.join(' ');
        },

        window,

        Node
    ];

})($C, window);

window.exampleState = (function (location) {
    var state,
        dls   = document.location.search,
        query = dls,
        query = query.substr(1, query.length).split('&');
        query = (function(query){
            var res = {};
            query.forEach(
                function(param){
                    var pair = param.split('=');
                    res[pair[0]] = pair[1] || true;
                }
            );
            return res;
        })(query),
        params = {
            'framework': dls.indexOf('backbone') >-1 ? 'backbone' : 'exoskeleton',
            '$':         dls.indexOf('jQuery')   >-1 ? 'jQuery'   : 'zepto',
            'runtest':   query['runtest'] || false,
            'one':       query['one']     || false
        };

    state = {

        'params': params,

        'name': function(str){
            return str.toLowerCase().replace(/[\.\s\-]/g,'_');
        },

        'url': function(options){

            var framework = options.framework || params.framework,
                $  = options.$ || params.$,
                f$ = framework + "&" + $,
                result = "?" + (f$ === 'exoskeleton&zepto' ? '' :  f$);

            if(options.section){
                result += "#" + options.section;
            }
            if(options.block){
                result += (params.one ? ("&one=" + options.block) : ("#"+ state.name(options.block)) );
            }
            if(options.sub){
                result += (params.one ? "#" +  state.name(options.block) : "") + '__' + state.name(options.sub);
            }
            if(options.runtest){
                result += '&runtest';
            }

            return '/' + result;
        }
    };

    return state;
})(window.location);
'use strict';

window.ExamplesSet = Backbone.Collection.extend({
    'meta': {},
    'url': './blocks.json',
    'initialize': function(){
        this.on('render', this.startTests);
        this.initTests();
        this.fetch();
    },
    'initTests': function(){
        window.tests  = {};
        window.expect = chai.expect;
        window.mocha.setup({ui:'bdd'});
    },
    'startTests': function(){
        if (exampleState.params.runtest) {
            this.runAllTests();
        }
    },
    'parse': function(scope){
        this.meta = scope.meta;
        return scope.blocks;
    },
    'runAllTests': function(){
        // one
        var set = this;

        this.forEach(
            function(block){
                describe(
                    "Test block «" + block.id+"» \n    " + exampleState.params.framework +":"+ exampleState.params.$,
                    set.blockTestSuite(block)
                );
            }
        );

        if ('mochaPhantomJS' in window) {
            mochaPhantomJS.run();
        } else {
            mocha.run(
                set.trigger.bind(set, 'testsComplete')
            );
        }
    },

    'blockTestSuite': function(block){
        return function(){
            var blockTests = block.get('code').filter(
                    function(sub){
                        return sub.type === 'TEST';
                    }
                ),
                code = block.get('code').filter(
                    function(sub){
                        return sub.type === 'SUITE';
                    }
                );
            code.forEach(
                function(suite){
                    var sHead  = suite.name +", "+ suite.opts,
                        sTests = blockTests
                                    .filter(
                                        function(test){
                                            return test.name.indexOf(sHead)===0;
                                        }
                                    );
                    describe(
                        suite.opts,
                        function(){
                            sTests
                                .forEach(
                                    function(test){
                                        it(
                                            test.name + (test.opts ? " : " + test.opts : ""),
                                            tests[test.sign]
                                        )
                                    }
                                )
                        }
                    )
                }
            );
        }
    }
});


'use strict';

window.ExamplesView = Backbone.View.extend({
    block: "i-examples",

    el: 'body',

    'events': {
        'click .i-example-test__run': 'runTest'
    },

    'initialize': function(){
        this.listenTo(this.collection, "sync", this.render);
        this.listenTo(this.collection, "testsComplete", this.afterAllTests);
        this.nodes = {};
        this.$content = this.$el.find('.i-examples-container');
        this.$sidebar = this.$el.find('.i-examples-sidebar');
    },

    'runAllTests': function(){
        document.location.href = exampleState.url({'runtest': true});
    },

    'afterAllTests': function(){
        $('#mocha').show();
        $('.i-examples-container').get(0).scrollTop = 0;
    },

    'mochaClear': function(){
        this.$mocha = $('#mocha');
        this.$mocha.empty();
        mocha.suite.tests = [];
        mocha.suite.title = "";
    },

    'runTest': function(e){
        var elem = e.target,
            testSign  = elem.getAttribute('data-test'),
            blockName = elem.getAttribute('data-name'),
            testFunc  = tests[testSign],
            $container = $(".sign-"+testSign),
            view = this;
        this.mochaClear();

        it(blockName, testFunc);

        mocha.run(
            function(){
                $container.addClass('mocha');
                $('.mocha-report-'+testSign).remove();
                $_mocha = view.$mocha.find('#mocha-report').clone();
                $_mocha.removeAttr('id');
                $_mocha.attr('class', 'mocha-report ' + 'mocha-report-'+testSign);
                $container.find('.i-example-test__run').replaceWith($_mocha);
                view.$mocha.empty();
            }
        );
    },

    'render': function(){
        this.sidebar() && this.content();
        this.collection.trigger('render');
    },

    'sidebar': function(){
        this.$sidebar.empty();
        this.nodes['sidebar'] = $C.tpl[this.block + "__sidebar"].call(this.$sidebar[0], this.collection);

        this.listenToOnce(
            this.nodes['sidebar'].test,
            'action',
            this.runAllTests
        );

        this.listenToOnce(
            this.nodes['sidebar'].be,
            'change:selected',
            this.reload
        );

        this.listenToOnce(
            this.nodes['sidebar'].jz,
            'change:selected',
            this.reload
        );

        return true;
    },

    'reload': function(){
        location.href = exampleState.url({
            'framework': this.nodes['sidebar'].be.get('selected').get('name'),
            '$':         this.nodes['sidebar'].jz.get('selected').get('name')
        });
    },

    'content': function(){
        this.$content.empty();
        this.nodes['content'] = $C.tpl[this.block].call(this.$content[0], this.collection);
        if(this.nodes.test){
            this.listenToOnce(
                this.nodes.test,
                'action',
                this.showTests
            );
            this.collection.listenToOnce(
                this.nodes.test,
                'action',
                this.collection.runTest
            )
        }

        this.renderExamples();

        this.$content.on(
            'scroll',
            function(){
                $(document.body).trigger('scroll');
            }
        );

        return true;
    },

    'renderSUITE': function(suite){
        this.$(".sign-"+suite.sign).prepend( "<h4 id="+ exampleState.name(suite.name +'__'+ suite.opts) +">"+ suite.opts +"</h4>" );
    },

    'renderCODE': function(code){
        var $code = $("<div class='i-example-prism'/>"),
            $container = this.$(".sign-"+code.sign);

        $(this.$(".sign-"+code.sign).children().get(0)).wrap("<div class='i-example-container'/>");

        $container.append( $code );
        $container.prepend( "<h4 class=i-example-code__header>"+ code.opts +"</h4>" );
        $C.tpl['i-prism'].call($code.get(0), code.code.join('\n'), 'ctpl');
    },

    'renderTEST': function(test){
        var $code = $("<div class='i-example-prism'/>");
        this.$(".sign-"+test.sign).append( $code );
        this.$(".sign-"+test.sign).prepend( "<div class='i-pseudo i-example-test__run' data-test='"+test.sign+"' data-name='"+test.name+"'>test</div>" );
        $C.tpl['i-prism'].call($code.get(0), test.code.join('\n'), 'javascript');
    },

    'renderExample': function(example){

        var view = this;
        example
            .get('code')
            .forEach(
                function(code){
                    var renderer = "render" + code.type;
                    view[ renderer ].call(view, code)
                }
            );
    },

    'renderExamples': function(){
        return this.collection.forEach(this.renderExample.bind(this));
    }
});

/* **********************************************
     Begin prism-core.js
********************************************** */

self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(){

// Private helper vars
var lang = /\blang(?:uage)?-(?!\*)(\w+)\b/i;

var _ = self.Prism = {
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function (o) {
			var type = _.util.type(o);

			switch (type) {
				case 'Object':
					var clone = {};

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key]);
						}
					}

					return clone;

				case 'Array':
					return o.map(function(v) { return _.util.clone(v); });
			}

			return o;
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need anobject and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before. If not provided, the function appends instead.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];
			
			if (arguments.length == 2) {
				insert = arguments[1];
				
				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}
				
				return grammar;
			}
			
			var ret = {};

			for (var token in grammar) {

				if (grammar.hasOwnProperty(token)) {

					if (token == before) {

						for (var newToken in insert) {

							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					ret[token] = grammar[token];
				}
			}
			
			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});

			return root[inside] = ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function(o, callback, type) {
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					if (_.util.type(o[i]) === 'Object') {
						_.languages.DFS(o[i], callback);
					}
					else if (_.util.type(o[i]) === 'Array') {
						_.languages.DFS(o[i], callback, i);
					}
				}
			}
		}
	},

	highlightAll: function(async, callback) {
		var elements = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1];
			grammar = _.languages[language];
		}

		if (!grammar) {
			return;
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		// Set language on the parent, for styling
		parent = element.parentNode;

		if (/pre/i.test(parent.nodeName)) {
			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		}

		var code = element.textContent;

		if(!code) {
			return;
		}

		code = code.replace(/^(?:\r?\n|\r)/,'');

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		_.hooks.run('before-highlight', env);

		if (async && self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				env.highlightedCode = Token.stringify(JSON.parse(evt.data), language);

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			callback && callback.call(element);

			_.hooks.run('after-highlight', env);
		}
	},

	highlight: function (text, grammar, language) {
		var tokens = _.tokenize(text, grammar);
		return Token.stringify(_.util.encode(tokens), language);
	},

	tokenize: function(text, grammar, language) {
		var Token = _.Token;

		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		tokenloop: for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					lookbehindLength = 0,
					alias = pattern.alias;

				pattern = pattern.pattern || pattern;

				for (var i=0; i<strarr.length; i++) { // Don’t cache length as it changes during the loop

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						break tokenloop;
					}

					if (str instanceof Token) {
						continue;
					}

					pattern.lastIndex = 0;

					var match = pattern.exec(str);

					if (match) {
						if(lookbehind) {
							lookbehindLength = match[1].length;
						}

						var from = match.index - 1 + lookbehindLength,
							match = match[0].slice(lookbehindLength),
							len = match.length,
							to = from + len,
							before = str.slice(0, from + 1),
							after = str.slice(to + 1);

						var args = [i, 1];

						if (before) {
							args.push(before);
						}

						var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias);

						args.push(wrapped);

						if (after) {
							args.push(after);
						}

						Array.prototype.splice.apply(strarr, args);
					}
				}
			}
		}

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content, alias) {
	this.type = type;
	this.content = content;
	this.alias = alias;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (env.type == 'comment') {
		env.attributes['spellcheck'] = 'true';
	}

	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = '';

	for (var name in env.attributes) {
		attributes += name + '="' + (env.attributes[name] || '') + '"';
	}

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '" ' + attributes + '>' + env.content + '</' + env.tag + '>';

};

if (!self.document) {
	if (!self.addEventListener) {
		// in Node.js
		return self.Prism;
	}
 	// In worker
	self.addEventListener('message', function(evt) {
		var message = JSON.parse(evt.data),
		    lang = message.language,
		    code = message.code;

		self.postMessage(JSON.stringify(_.util.encode(_.tokenize(code, _.languages[lang]))));
		self.close();
	}, false);

	return self.Prism;
}

// Get current script and highlight
var script = document.getElementsByTagName('script');

script = script[script.length - 1];

if (script) {
	_.filename = script.src;

	if (document.addEventListener && !script.hasAttribute('data-manual')) {
		document.addEventListener('DOMContentLoaded', _.highlightAll);
	}
}

return self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism;
}


/* **********************************************
     Begin prism-markup.js
********************************************** */

Prism.languages.markup = {
	'comment': /<!--[\w\W]*?-->/,
	'prolog': /<\?.+?\?>/,
	'doctype': /<!DOCTYPE.+?>/,
	'cdata': /<!\[CDATA\[[\w\W]*?]]>/i,
	'tag': {
		pattern: /<\/?[\w:-]+\s*(?:\s+[\w:-]+(?:=(?:("|')(\\?[\w\W])*?\1|[^\s'">=]+))?\s*)*\/?>/i,
		inside: {
			'tag': {
				pattern: /^<\/?[\w:-]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[\w-]+?:/
				}
			},
			'attr-value': {
				pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
				inside: {
					'punctuation': /=|>|"/
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[\w:-]+/,
				inside: {
					'namespace': /^[\w-]+?:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});


/* **********************************************
     Begin prism-css.js
********************************************** */

Prism.languages.css = {
	'comment': /\/\*[\w\W]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
		inside: {
			'punctuation': /[;:]/
		}
	},
	'url': /url\((?:(["'])(\\\n|\\?.)*?\1|.*?)\)/i,
	'selector': /[^\{\}\s][^\{\};]*(?=\s*\{)/,
	'string': /("|')(\\\n|\\?.)*?\1/,
	'property': /(\b|\B)[\w-]+(?=\s*:)/i,
	'important': /\B!important\b/i,
	'punctuation': /[\{\};:]/,
	'function': /[-a-z0-9]+(?=\()/i
};

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /<style[\w\W]*?>[\w\W]*?<\/style>/i,
			inside: {
				'tag': {
					pattern: /<style[\w\W]*?>|<\/style>/i,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.css
			},
			alias: 'language-css'
		}
	});
	
	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|').*?\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
}

/* **********************************************
     Begin prism-clike.js
********************************************** */

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': /("|')(\\\n|\\?.)*?\1/,
	'class-name': {
		pattern: /((?:(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(true|false)\b/,
	'function': {
		pattern: /[a-z0-9_]+\(/i,
		inside: {
			punctuation: /\(/
		}
	},
	'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/,
	'operator': /[-+]{1,2}|!|<=?|>=?|={1,3}|&{1,2}|\|?\||\?|\*|\/|~|\^|%/,
	'ignore': /&(lt|gt|amp);/i,
	'punctuation': /[{}[\];(),.:]/
};


/* **********************************************
     Begin prism-javascript.js
********************************************** */

Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|get|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|set|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|-?Infinity)\b/,
	'function': /(?!\d)[a-z0-9_$]+(?=\()/i
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true
	}
});

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /<script[\w\W]*?>[\w\W]*?<\/script>/i,
			inside: {
				'tag': {
					pattern: /<script[\w\W]*?>|<\/script>/i,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.javascript
			},
			alias: 'language-javascript'
		}
	});
}


/* **********************************************
     Begin prism-file-highlight.js
********************************************** */

(function () {
	if (!self.Prism || !self.document || !document.querySelector) {
		return;
	}

	self.Prism.fileHighlight = function() {

		var Extensions = {
			'js': 'javascript',
			'html': 'markup',
			'svg': 'markup',
			'xml': 'markup',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell'
		};

		Array.prototype.slice.call(document.querySelectorAll('pre[data-src]')).forEach(function(pre) {
			var src = pre.getAttribute('data-src');
			var extension = (src.match(/\.(\w+)$/) || [,''])[1];
			var language = Extensions[extension] || extension;

			var code = document.createElement('code');
			code.className = 'language-' + language;

			pre.textContent = '';

			code.textContent = 'Loading…';

			pre.appendChild(code);

			var xhr = new XMLHttpRequest();

			xhr.open('GET', src, true);

			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {

					if (xhr.status < 400 && xhr.responseText) {
						code.textContent = xhr.responseText;

						Prism.highlightElement(code);
					}
					else if (xhr.status >= 400) {
						code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
					}
					else {
						code.textContent = '✖ Error: File does not exist or is empty';
					}
				}
			};

			xhr.send(null);
		});

	};

	self.Prism.fileHighlight();

})();

Prism.languages.ctpl = Prism.languages.extend('clike', {
	'keyword': /\b(CALL|AS|SET|WHEN|CHOOSE|OTHERWISE|ELSE|TEST|MEM|ACT|JS|EXPOSE)\b/g,
    'punctuation': /[{}[\];(),.@:]/g,
	'variables': /\$[a-zA-Z0-9_]+/g,
	'function': {
		pattern: /([a-z0-9]+::[a-z0-9_-]*)/ig,
		inside: {
			punctuation: /(::)/
		}
	},
    'backbone': /\b(Backbone|Model|Collection|extend)\b/g,
    'js': /\b(function|var|return|if|else|switch|new|for|while|break|continue|void|catch|default|delete|do|import|export|in|this|throw|try|typeof|instanceof)\b/g,

});

(function(){
"use strict";
var qex_controls = {}; 

(function(ns){
// This file is autogenerated.
(function($C, $ConkittyEnvClass, $ConkittyGetEnv, $ConkittyClasses, $ConkittyMod, $ConkittyChange, window, Node, undefined) {

$C.tpl["examples-content"] = function($set) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $packageName, $container, $title, $run;
    return $C($ConkittyEnv.p)
        .act(function $C_examples_content_4_5() { $packageName = ($set.meta.qex.name); })
        .li({"class": "i-examples-content-item"})
            .a({"class": "i-examples-content-item__title package-name"})
                .attr("name", "Top")
                .text(function $C_examples_content_9_14() { return $packageName; })
            .end()
            .p()
                .text("This is a library of UI blocks based on a number of modern front-end technologies which transparently demonstrates our approach to Single Page Applications. We are providing this library with documentation, examples and tests which are built on qex-controls library and should give explanations to various aspects of a block's architecture from within, so feel free to look inside. Additionally, you can run all of the tests with button 'run tests' on the left menu, with 'gulp test' CLI command or test blocks separately clicking on links under examples.")
            .end()
            .p()
                .text("The project is hosted on ")
                .a()
                    .attr("href", "https://github.com")
                    .text("GitHub")
                .end()
                .text(" and is available for use under the MIT software license.")
        .end(2)
        .li({"class": "i-examples-content-item"})
            .a({"class": "i-examples-content-item__title"})
                .attr("name", "Dependencies")
                .text("Dependencies")
            .end()
            .p()
                .text("Qex-controls should be configured with last versions of ")
                .a()
                    .attr("href", "http://backbonejs.org")
                    .text("Backbone.js")
                .end()
                .text(" and ")
                .a()
                    .attr("href", "https://github.com/hoho/conkitty")
                    .text("Conkitty")
                .end()
                .text(". Backbone.js could be replaced with lightweight ")
                .a()
                    .attr("href", "http://exosjs.com")
                    .text("Exoskeleton")
                .end()
                .text(" if needed. Conkitty is a DOM-constructor with pretty syntax indented like ")
                .a()
                    .attr("href", "http://jade-lang.com/")
                    .text("Jade")
                .end()
                .text(", compiler, ")
                .a()
                    .attr("href", "https://github.com/hoho/grunt-conkitty")
                    .text("grunt")
                .end()
                .text(" and ")
                .a()
                    .attr("href", "https://github.com/hoho/gulp-conkitty")
                    .text("gulp")
                .end()
                .text(" plugins, syntax highlighters for ")
                .a()
                    .attr("href", "http://plugins.jetbrains.com/plugin/7348")
                    .text("IntelliJ IDEA")
                .end()
                .text(" and ")
                .a()
                    .attr("href", "https://github.com/maetchkin/conkitty-st3-yaml")
                    .text("Sublime Text")
                .end()
                .text(".")
        .end(2)
        .li({"class": "i-examples-content-item"})
            .a({"class": "i-examples-content-item__title"})
                .attr("name", "Introduction")
                .text("Introduction")
            .end()
            .p()
                .text("Web applications we are building, maintaining and scaling make demands to components we are choosing. At first, let's separate macro- and micro- levels of an application where we use blocks and where we build them for futher usage, respectively.")
            .end()
            .p()
                .text("Single Page Application could have a complex nature, process a wide range of states and needs an easy way to consume components through clear and stable API. On the top of business-logic of an application we want to have a deal with well-structured, tested components not taking care about dependencies and internal implementation. In this respect, blocks' abstraction based on Backbone API seems to be a good choice to use it as a kind of MVVM design pattern.")
            .end()
            .p()
                .text("Persistent need of independent blocks grows out the current state of web architecture used to build an application that typically was only desktop earlier. Serving such objectives requires clear rules for managing dependencies, explicit declarations for each block and it's better to be flexible and modular.")
            .end()
            .p()
                .text("So we shall keep in mind these requirements while building blocks and block libraries to keep them simple, customizable and independent.")
            .end()
            .p()
                .text("The concept of blocks is pretty clear and could be defined with a pair of theses")
                .ul({"class": "definitions"})
                    .li()
                        .b()
                            .text("Blocks are independent components")
                        .end()
                        .p()
                            .text("Common meaning of blocks architecture is close to ")
                            .a()
                                .attr("href", "https://en.bem.info/method/definitions/")
                                .text("BEM method")
                            .end()
                            .text(", generalizing some of decomposition principles and naming conventions.")
                    .end(2)
                    .li()
                        .b()
                            .text("Blocks have flexible structure and provide stable interface")
                        .end()
                        .p()
                            .text("Each block may be implemented with any HTML, CSS, JS, images, fonts and other native or transpilled technologies. The block's heterogeneous nature is hidden behind stable API which is abstracting such low-level details as dependencies inside block-specific file structure and contained technologies used for build.")
            .end(4)
            .p()
                .text("And some theses about block's libraries")
                .ul({"class": "definitions"})
                    .li()
                        .text("Libraries of blocks have dependency management system, custom file naming rules")
                    .end()
                    .li()
                        .text("Libraries of blocks are integrated into project's build system")
                    .end()
                    .li()
                        .text("Libraries of blocks are distributed with tests and docs")
            .end(3)
            .p()
                .text(" So, let's construct top-level block using an existing one, like in example below with  i::button:")
            .end()
            .div({"class": "i-example-code sign-34042722126469016"})
                .div({"class": "example-block"})
                    .act(function() { $container = this; })
                    .span({"class": "example-block__title"})
                        .act(function() { $title = this; })
                        .text("Hello, bro")
                    .end()
                    .act(function() {
                        $run = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ('run'));
                    })
                    .act(function() {
                        $run.on(



                            'action',
                            function(){
                                $run.set("loading", true);
                                $title.textContent += ", I'm running";
                                $container.classList.add("example-block__running");
                            }
                        );

                    })
        .end(3)
        .li({"class": "i-examples-content-item"})
            .a({"class": "i-examples-content-item__title"})
                .attr("name", "Blocks")
                .text("Blocks")
    .end(3);
};

$C.tpl["i-button__label"] = function($model) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .span({"class": "i-button__label"})
            .text(function $C_i_button__label_48_9() { return ($model.get("label")); })
    .end(2);
};

$C.tpl["i-examples"] = function($set) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $mocha, $block;
    $C($ConkittyEnv.p)
        .div({"class": "i-examples"})
            .ul({"class": "i-examples-content"})
                .li({"class": "mocha i-examples-content-item", "id": "mocha"})
                    .act(function() { $mocha = this; })
                .end()
                .test(function $C_i_examples_15_18() { return (!exampleState.params.one); })
                    .act(function() {
                        $C.tpl["examples-content"].call(new $ConkittyEnvClass(this), $set);
                    })
                .end()
                .each(function $C_i_examples_17_25() { return ($set.models); })
                    .act(function($C_) { $block = $C_; })
                    .test(function $C_i_examples_18_22() { return ($block.get("code").length && (exampleState.params.one ? $block.id=== exampleState.params.one : true ) ); })
                        .act(function() {
                            $C.tpl["i-examples__content-item"].call(new $ConkittyEnvClass(this), $block);
                        })
        .end(4)
        .act(function() { $ConkittyTemplateRet = ({'mocha': $mocha}); })
    .end();
    return $ConkittyTemplateRet;
};

$C.tpl["i-examples__content-item"] = function($block) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .test(function $C_i_examples__content_item_128_10() { return ($block.id.indexOf('i')===0); })
            .li({"class": "i-examples-content-item"})
                .act(function() {
                    $C.tpl["i-examples__content-item__title"].call(new $ConkittyEnvClass(this), ($block.id));
                })
                .act(function() {
                    $C.tpl[($block.id+"-example")].call(new $ConkittyEnvClass(this), $block);
                })
    .end(3);
};

$C.tpl["i-examples__content-item__title"] = function($id) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .div({"class": "i-examples-content-item__title"})
            .a({"class": "i-examples-content-item__title-head"})
                .attr("name", function $C_i_examples__content_item__title_136_19() { return (exampleState.name($id)); })
                .text(function $C_i_examples__content_item__title_137_13() { return ($id); })
            .end()
            .a({"class": "i-examples-content-item__title-one"})
                .choose()
                    .when(function $C_i_examples__content_item__title_140_22() { return (location.search.match(/(?:\&|\?)one=(?:[^&]*)/)); })
                        .attr("href", function $C_i_examples__content_item__title_141_27() { return (location.search.replace(/(?:\&|\?)one=(?:[^&]*)/,'') || '?' ); })
                        .text("«")
                    .end()
                    .otherwise()
                        .attr("href", function $C_i_examples__content_item__title_144_27() { return ((location.search ? location.search + "&" : "?") + "one="+$id); })
                        .text("»")
    .end(5);
};

$C.tpl["i-examples__sidebar"] = function($set) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $sidebar, $bePackagesSelector, $jzPackagesSelector, $runTest;
    $C($ConkittyEnv.p)
        .act(function $C_i_examples__sidebar_23_5() { $sidebar = ({}); })
        .test(function $C_i_examples__sidebar_24_10() { return ($set.meta.qex); })
            .ul({"class": "i-examples-menu"})
                .li({"class": "i-examples-menu-item"})
                    .act(function() {
                        $C.tpl["i-examples__toc-section"].call(new $ConkittyEnvClass(this), $set);
                    })
                .end()
                .li({"class": "i-examples-menu-item"})
                    .a({"class": "toc-title"})
                        .attr("href", function $C_i_examples__sidebar_32_27() { return (exampleState.url({'section': 'Dependencies'})); })
                        .text("Dependencies")
                .end(2)
                .act(function() {
                    $bePackagesSelector = $C.tpl["i-examples__packages-selector"].call(new $ConkittyEnvClass(this), ($set.meta.frameworks), (exampleState.params.framework));
                })
                .act(function() {
                    $jzPackagesSelector = $C.tpl["i-examples__packages-selector"].call(new $ConkittyEnvClass(this), ($set.meta.$), (exampleState.params.$));
                })
                .act(function() {
                    $C.tpl["i-examples__packages-kitty"].call(new $ConkittyEnvClass(this), ($set.meta.kitty));
                })
                .li({"class": "i-examples-menu-item"})
                    .a({"class": "toc-title"})
                        .attr("href", function $C_i_examples__sidebar_41_27() { return (exampleState.url({'section': 'Introduction'})); })
                        .text("Introduction")
                .end(2)
                .li({"class": "i-examples-menu-item"})
                    .act(function() {
                        $runTest = $C.tpl["i-examples__blocks-section"].call(new $ConkittyEnvClass(this), $set);
                    })
            .end(2)
            .act(function() {
                $sidebar.be     = $bePackagesSelector;
                $sidebar.jz     = $jzPackagesSelector;
                $sidebar.test   = $runTest;
            })
        .end()
        .act(function() { $ConkittyTemplateRet = ($sidebar); })
    .end();
    return $ConkittyTemplateRet;
};

$C.tpl["i-examples__toc-section"] = function($set) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .a({"class": "toc-title"})
            .attr("href", function $C_i_examples__toc_section_88_15() { return (exampleState.url({'section': 'Top'})); })
            .text(function $C_i_examples__toc_section_89_9() { return ($set.meta.qex.name || ""); })
            .span({"class": "version"})
                .text(function $C_i_examples__toc_section_91_13() { return ( $set.meta.qex.version ? " (" + $set.meta.qex.version + ")" : "" ); })
        .end(2)
        .ul({"class": "i-examples-menu toc_section"})
            .li()
                .a({"class": "toc-link"})
                    .attr("href", "https://github.com/maetchkin/qex-controls")
                    .text("GitHub Repository")
    .end(4);
};

$C.tpl["i-examples__packages-selector"] = function($options, $selected) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $packages, $packagesSelector;
    $C($ConkittyEnv.p)
        .li({"class": "i-examples-menu-item i-examples-menu-item__packages-selector"})
            .act(function $C_i_examples__packages_selector_61_9() { $packages = (new Backbone.Collection($options)); })
            .act(function() {
                $packagesSelector = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ({
                                'options': $packages,
                                'size': 'S',
                                "viewButton": "i-examples__packages-selector-option",
                                "viewOption": "i-examples__packages-selector-option"
                            }));
            })
        .end()
        .act(function() {
            $packagesSelector.select(
                $packages.findWhere({name: $selected})
            );
        })
        .act(function() { $ConkittyTemplateRet = ($packagesSelector); })
    .end();
    return $ConkittyTemplateRet;
};

$C.tpl["i-select__options-list"] = function($select) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $optionsList, $list;
    $C($ConkittyEnv.p)
        .ul({"class": "i-select__options-list"})
            .act(function() { $list = this; })
        .end()
        .act(function() {
            $optionsList = new ns.views.selectOptions({
                'el': $list,
                'model': $select
            });
        })
        .act(function() { $ConkittyTemplateRet = $optionsList; })
    .end();
    return $ConkittyTemplateRet;
};

$C.tpl["i-examples__packages-kitty"] = function($kitty) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $kittyItem;
    return $C($ConkittyEnv.p)
        .li()
            .act(function() { $kittyItem = this; })
            .attr("class", function() { return $ConkittyChange(this, "i-examples-menu-item"); })
            .attr("class", function() { return $ConkittyChange(this, "i-examples-menu-item__packages-selector"); })
            .attr("class", function() { return $ConkittyChange(this, "i-examples-menu-item__packages-kitty"); })
            .act(function() {
                $C.tpl["i-examples__packages-selector-option"].call(new $ConkittyEnvClass(this), (new Backbone.Model($kitty)));
            })
    .end(2);
};

$C.tpl["i-examples__packages-selector-option"] = function($option) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .choose()
            .when(function $C_i_examples__packages_selector_option_76_14() { return ($option); })
                .div({"class": "i-examples-menu-item__packages-selector-option"})
                    .span({"class": "name"})
                        .text(function $C_i_examples__packages_selector_option_79_21() { return ($option.get('name')); })
                    .end()
                    .span({"class": "version"})
                        .text(function $C_i_examples__packages_selector_option_81_21() { return ($option.get('version')); })
            .end(3)
            .otherwise()
                .text("&nbsp;", true)
    .end(3);
};

$C.tpl["i-examples__blocks-section"] = function($set) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $runTest, $block;
    $C($ConkittyEnv.p)
        .a({"class": "toc-title"})
            .attr("href", function $C_i_examples__blocks_section_100_15() { return (exampleState.url({'section': 'Blocks'})); })
            .text("Blocks")
        .end()
        .text(" ")
        .act(function() {
            $runTest = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({'label':'run tests', 'size':'XS'}));
        })
        .ul({"class": "i-examples-menu toc-section"})
            .each(function $C_i_examples__blocks_section_105_21() { return ($set.models); })
                .act(function($C_) { $block = $C_; })
                .test(function $C_i_examples__blocks_section_106_18() { return ($block.get("code").length && $block.id.indexOf('i')===0); })
                    .act(function() {
                        $C.tpl["i-examples__menu-item"].call(new $ConkittyEnvClass(this), $block);
                    })
        .end(3)
        .act(function() { $ConkittyTemplateRet = ($runTest); })
    .end();
    return $ConkittyTemplateRet;
};

$C.tpl["i-examples__menu-item"] = function($block) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $sub;
    return $C($ConkittyEnv.p)
        .li({"class": "i-examples-menu-item"})
            .a({"class": "toc-link toc-link-section"})
                .attr("href", function $C_i_examples__menu_item_113_19() { return (exampleState.url({'block': $block.id})); })
                .text(function $C_i_examples__menu_item_114_13() { return ($block.id); })
            .end()
            .ul({"class": "i-examples-menu toc-section block"})
                .each(function $C_i_examples__menu_item_116_23() { return ($block.get("code").filter(function(sub){return sub.type==='SUITE'})); })
                    .act(function($C_) { $sub = $C_; })
                    .act(function() {
                        $C.tpl["i-examples__menu-item-sub"].call(new $ConkittyEnvClass(this), $sub);
                    })
    .end(4);
};

$C.tpl["i-examples__menu-item-sub"] = function($sub) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .li({"class": "i-examples-menu-item"})
            .a({"class": "toc-link"})
                .attr("href", function $C_i_examples__menu_item_sub_122_19() { return (exampleState.url({'sub': $sub.opts, 'block': $sub.name})); })
                .text(" - ")
                .text(function $C_i_examples__menu_item_sub_124_13() { return ($sub.opts); })
    .end(3);
};

$C.tpl["i-example"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .div({"class": "i-example"})
            .elem("h4")
                .text("Namespace declaration")
            .end()
            .p()
                .text("Dependencies are managed by declarations inside templates and could be effectively used within ")
                .a()
                    .attr("href", "https://github.com/hoho/conkitty#namespaced-templates")
                    .text("Conkitty namespaces")
                .end()
                .text(".")
            .end()
            .div({"class": "i-example-code sign-5774934936780483"})
            .end()
            .div({"class": "i-example-code sign-46243858546949923"})
            .end()
            .p()
                .text("See examples below")
    .end(3);
};

$C.tpl["i-button-example"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .ul({"class": "i-example__list"})
            .li({"class": "i-example__list-item"})
                .p()
                    .text("Button state is represented by Backbone.Model. Constructor can recognize following types of input data: String or Object")
                .end()
                .div({"class": "i-example-code sign-19669796829111874"})
                .end()
                .act(function() {
                    $C.tpl["i-button-example__options"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-button-example__label"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-button-example__sizing"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-button-example__action"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-button-example__checked"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-button-example__disabled"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-button-example__loading"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-button-example__custom"].call(new $ConkittyEnvClass(this));
                })
    .end(3);
};

$C.tpl["i-button-example__options"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .elem("h4")
            .text("Options")
        .end()
        .p()
            .elem("dl")
                .elem("dt")
                    .text("label")
                .end()
                .elem("dd")
                    .text("String. Required.")
                .end()
                .elem("dt")
                    .text("size")
                .end()
                .elem("dd")
                    .text("L, M, S or XS. M by default")
                .end()
                .elem("dt")
                    .text("action")
                .end()
                .elem("dd")
                    .text("Boolean. false by default. Use to highlight button with action color.")
                .end()
                .elem("dt")
                    .text("disabled")
                .end()
                .elem("dd")
                    .text("Boolean. false by default")
                .end()
                .elem("dt")
                    .text("loading")
                .end()
                .elem("dd")
                    .text("Boolean. false by default")
                .end()
                .elem("dt")
                    .text("checked")
                .end()
                .elem("dd")
                    .text("Boolean. false by default")
                .end()
                .elem("dt")
                    .text("template")
                .end()
                .elem("dd")
                    .text("String. Custom template name instead default")
    .end(4);
};

$C.tpl["i-button-example__label"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $button, $node, $buttonOptions;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-16840086900629103"})
            .div({"class": "i-example-code sign-15488501824438572"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $button = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ("click me"));
                    })
                .end()
                .act(function $C_i_button_example__label_59_21() { $node = ($($container.firstChild)); })
                .act(function() {
                    tests['10906766494736075'] = function(){


                        expect( $button ).to.be.an.instanceof(Backbone.Model);

                        expect( $button.get('label') ).to.be.equal('click me');

                        expect( $node.find('.i-button__label').text() ).to.be.equal('click me');

                        expect( $button.get('init') ).to.be.false;

                        $node.trigger( $.Event('mouseover') );

                        expect( $button.get('init') ).to.be.true;


                        var action = sinon.spy();

                        $button.on('action', action);

                        $node.trigger($.Event('mousedown'));

                        expect( $node.hasClass('i-button__pressed') ).to.be.a.true;

                        expect( action.called ).to.be.a.false;

                        $node.trigger($.Event('mouseup'));

                        expect( $node.hasClass('i-button__pressed') ).to.be.a.false;

                        expect( action.called ).to.be.a.true;
                        expect( action.calledOnce ).to.be.a.true;
                        expect( action.calledOn($button) ).to.be.a.true;

                    }
                })
                .div({"class": "i-example-test sign-10906766494736075"})
            .end(2)
            .div({"class": "i-example-code sign-797269037226215"})
                .act(function() {
                    $buttonOptions = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({"label": "click me"}));
                })
                .act(function() {
                    tests['29786723712459207'] = function(){

                        expect( $buttonOptions ).to.be.an.instanceof(Backbone.Model);
                        expect( $buttonOptions.get("label") ).to.be.equal("click me");

                    }
                })
                .div({"class": "i-example-test sign-29786723712459207"})
    .end(4);
};

$C.tpl["i-button-example__sizing"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $Lsize, $Msize, $Ssize, $XSsize;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-1427299666684121"})
            .div({"class": "i-example-code sign-9225474228151143"})
                .div({"class": "i-example__button-sizing"})
                    .div()
                        .act(function() { $Lsize = this; })
                        .act(function() {
                            $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({"label":"L-size",  "size": "L"}));
                        })
                    .end()
                    .div()
                        .act(function() { $Msize = this; })
                        .act(function() {
                            $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({"label":"M-size",  "size": "M"}));
                        })
                    .end()
                    .div()
                        .act(function() { $Ssize = this; })
                        .act(function() {
                            $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({"label":"S-size",  "size": "S"}));
                        })
                    .end()
                    .div()
                        .act(function() { $XSsize = this; })
                        .act(function() {
                            $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({"label":"XS-size", "size": "XS"}));
                        })
            .end(3)
            .act(function() {
                tests['7299162473063916'] = function(){

                    var $L  = $($Lsize.firstChild),
                        $M  = $($Msize.firstChild),
                        $S  = $($Ssize.firstChild),
                        $XS = $($XSsize.firstChild);

                    expect( $L.hasClass('i-button__size-L' )).to.be.true;
                    expect( $M.hasClass('i-button__size-M' )).to.be.true;
                    expect( $S.hasClass('i-button__size-S' )).to.be.true;
                    expect($XS.hasClass('i-button__size-XS')).to.be.true;

                    expect($L.height() > $M.height() ).to.be.true;
                    expect($M.height() > $S.height() ).to.be.true;
                    expect($S.height() > $XS.height()).to.be.true;

                }
            })
            .div({"class": "i-example-test sign-7299162473063916"})
    .end(3);
};

$C.tpl["i-button-example__action"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $button, $node;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-7962081918958575"})
            .p()
                .text("Buttons with 'action' state should be used to show user his way to succeed")
            .end()
            .div({"class": "i-example-code sign-232139824423939"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $button = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({
                                                    "label": "action",
                                                    "action": true
                                                }));
                    })
                .end()
                .act(function $C_i_button_example__action_157_21() { $node = ($($container.firstChild)); })
                .act(function() {
                    tests['9692829174455255'] = function(){

                        expect( $button.get("action") ).to.be.true();
                        expect( $node.hasClass('i-button__action') ).to.be.a.true;
                        $button.set("action", false);
                        expect( $button.get("action") ).to.be.false();
                        expect( $node.hasClass('i-button__action') ).to.be.a.false;

                    }
                })
                .div({"class": "i-example-test sign-9692829174455255"})
    .end(4);
};

$C.tpl["i-button-example__checked"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $button, $node;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-5134869760368019"})
            .p()
                .text("Buttons with 'checked' state could be used the same way as a checkbox.")
            .end()
            .div({"class": "i-example-code sign-9717139115091413"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $button = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({
                                                    "label": "checked",
                                                    "checked": true
                                                }));
                    })
                .end()
                .act(function $C_i_button_example__checked_182_21() { $node = ($($container.firstChild)); })
                .act(function() {
                    tests['20374206989072263'] = function(){

                        expect( $button.get('checked') ).to.be.true();
                        expect( $node.hasClass('i-button__checked') ).to.be.a.true;
                        $button.set("checked", false);
                        expect( $button.get("checked") ).to.be.false();
                        expect( $node.hasClass('i-button__checked') ).to.be.a.false;

                    }
                })
                .div({"class": "i-example-test sign-20374206989072263"})
    .end(4);
};

$C.tpl["i-button-example__disabled"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $button, $node;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-127018817467615"})
            .p()
                .text("User can not interact with disabled buttons")
            .end()
            .div({"class": "i-example-code sign-9865720234811306"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $button = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({
                                                    "label": "disabled",
                                                    "disabled": true
                                                }));
                    })
                .end()
                .act(function $C_i_button_example__disabled_207_21() { $node = ($($container.firstChild)); })
                .act(function() {
                    tests['39159402321092784'] = function(){


                        expect( $button.get('disabled') ).to.be.true();

                        expect( $node.attr('tabindex') ).to.equal('-1');
                        expect( $node.attr('disabled') ).to.be.ok;
                        expect( $node.hasClass('i-button__disabled') ).to.be.a.true;

                        $node.trigger($.Event('mouseover'));
                        var action = sinon.spy();
                        $button.on('action', action);

                        $node.trigger($.Event('mousedown'));
                        expect( $node.hasClass('i-button__pressed') ).to.be.false;

                        $node.trigger($.Event('mouseup'));
                        expect( action.called ).to.be.false;

                        $button.set('disabled', false);

                        expect( $node.attr('tabindex') ).to.equal('0');
                        expect( $node.attr('disabled') ).to.be.not.ok;
                        expect( $node.hasClass('i-button__disabled') ).to.be.a.false;

                        $node.trigger($.Event('mousedown'));
                        expect( $node.hasClass('i-button__pressed') ).to.be.true;

                        $node.trigger($.Event('mouseup'));
                        expect( action.calledOnce ).to.be.a.true;
                        expect( action.calledOn($button) ).to.be.a.true;

                    }
                })
                .div({"class": "i-example-test sign-39159402321092784"})
    .end(4);
};

$C.tpl["i-button-example__loading"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $button, $node;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-731603434542194"})
            .p()
                .text("If user's actions have started a long-term process like an asynchronous request we should indicate the loading state.")
            .end()
            .div({"class": "i-example-code sign-5976170338690281"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $button = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({
                                                    "label": "loading",
                                                    "loading": true
                                                }));
                    })
                .end()
                .act(function $C_i_button_example__loading_256_21() { $node = ($($container.firstChild)); })
                .act(function() {
                    tests['3401694856584072'] = function(){

                        expect( $button.get('loading') ).to.be.true();

                        expect( $node.attr('tabindex') ).to.equal('-1');
                        expect( $node.attr('disabled') ).to.be.ok;
                        expect( $node.hasClass('i-button__loading') ).to.be.a.true;

                        $node.trigger($.Event('mouseover'));
                        var action = sinon.spy();
                        $button.on('action', action);

                        $node.trigger($.Event('mousedown'));
                        expect( $node.hasClass('i-button__pressed') ).to.be.false;

                        $node.trigger($.Event('mouseup'));
                        expect( action.called ).to.be.false;

                        $button.set('loading', false);

                        expect( $node.attr('tabindex') ).to.equal('0');
                        expect( $node.attr('disabled') ).to.be.not.ok;
                        expect( $node.hasClass('i-button__loading') ).to.be.a.false;

                        $node.trigger($.Event('mousedown'));
                        expect( $node.hasClass('i-button__pressed') ).to.be.true;

                        $node.trigger($.Event('mouseup'));
                        expect( action.calledOnce ).to.be.a.true;
                        expect( action.calledOn($button) ).to.be.a.true;

                    }
                })
                .div({"class": "i-example-test sign-3401694856584072"})
    .end(4);
};

$C.tpl["i-button-example__custom"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $node;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-9867816283367574"})
            .p()
                .text("It's easy to customize button with 'template' option")
            .end()
            .div({"class": "i-example-code sign-35455710464157164"})
            .end()
            .div({"class": "i-example-code sign-026179231703281403"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({
                                                    "label":"custom",
                                                    "value": "123",
                                                    "template": "i-button__custom"
                                                }));
                    })
                .end()
                .act(function $C_i_button_example__custom_306_21() { $node = ($($container.firstChild)); })
                .act(function() {
                    tests['28178050299175084'] = function(){

                        var $label = $node.find('.i-button__custom-label'),
                            $badge = $node.find('.i-button__custom-badge');

                        expect( $label.length ).to.be.equal(1);
                        expect( $badge.length ).to.be.equal(1);

                        expect( $label.text() ).to.be.equal("custom");
                        expect( $badge.text() ).to.be.equal("123");

                    }
                })
                .div({"class": "i-example-test sign-28178050299175084"})
    .end(4);
};

$C.tpl["i-button__custom"] = function($model) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .span({"class": "i-button__custom-label"})
            .text(function $C_i_button__custom_3_9() { return ($model.get("label")); })
        .end()
        .span({"class": "i-button__custom-badge"})
            .text(function $C_i_button__custom_5_9() { return ($model.get("value")); })
    .end(2);
};

$C.tpl["i-button-group-example"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .ul({"class": "i-example__list"})
            .li({"class": "i-example__list-item"})
                .p()
                    .text("Constructor can recognize following types of input data: String, Array and Object")
                .end()
                .div({"class": "i-example-code sign-7685583024285734"})
            .end(2)
            .act(function() {
                $C.tpl["i-button-group-example__options"].call(new $ConkittyEnvClass(this));
            })
            .act(function() {
                $C.tpl["i-button-group-example__string"].call(new $ConkittyEnvClass(this));
            })
            .act(function() {
                $C.tpl["i-button-group-example__array"].call(new $ConkittyEnvClass(this));
            })
            .act(function() {
                $C.tpl["i-button-group-example__collection"].call(new $ConkittyEnvClass(this));
            })
            .act(function() {
                $C.tpl["i-button-group-example__object"].call(new $ConkittyEnvClass(this));
            })
            .act(function() {
                $C.tpl["i-button-group-example__sizing"].call(new $ConkittyEnvClass(this));
            })
            .act(function() {
                $C.tpl["i-button-group-example__customization"].call(new $ConkittyEnvClass(this));
            })
    .end(2);
};

$C.tpl["i-button-group-example__options"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .elem("h4")
                .text("Options")
            .end()
            .p()
                .elem("dl")
                    .elem("dt")
                        .text("buttons")
                    .end()
                    .elem("dd")
                        .text("String, Array or Backbone.Collection")
                    .end()
                    .elem("dt")
                        .text("radiocheck")
                    .end()
                    .elem("dd")
                        .text("Boolean. false by default")
                    .end()
                    .elem("dt")
                        .text("delim")
                    .end()
                    .elem("dd")
                        .text("String. ',' by default")
    .end(5);
};

$C.tpl["i-button-group-example__string"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $group, $node, $buttons, $collection, $radiocheck;
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-8783673557918519"})
                .div({"class": "i-example-code sign-43052733154036105"})
                    .span()
                        .act(function() { $container = this; })
                        .act(function() {
                            $group = $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ('One,Two,Three'));
                        })
                    .end()
                    .act(function $C_i_button_group_example__string_41_25() { $node = ($($container.firstChild)); })
                    .act(function $C_i_button_group_example__string_42_25() { $buttons = ($node.find(".i-button")); })
                    .act(function $C_i_button_group_example__string_43_25() { $collection = ($group.get('buttons')); })
                    .act(function() {
                        tests['2599115567281842'] = function(){


                            expect( $group ).to.be.an.instanceof(Backbone.Model);

                            expect( $collection ).to.be.an.instanceof(Backbone.Collection);
                            expect( $collection.length ).to.be.equal(3);
                            expect( $collection.models.length ).to.be.equal(3);

                            var $button_1 = $collection.at(0),
                                $button_2 = $collection.at(1),
                                $button_3 = $collection.at(2);
                            expect( $button_1.get('label') ).to.be.equal('One');
                            expect( $button_2.get('label') ).to.be.equal('Two');
                            expect( $button_3.get('label') ).to.be.equal('Three');

                            expect( $buttons.length ).to.be.equal(3);

                            expect( $($buttons.get(0)).text() ).to.be.equal( 'One' );
                            expect( $($buttons.get(1)).text() ).to.be.equal( 'Two' );
                            expect( $($buttons.get(2)).text() ).to.be.equal( 'Three' );

                            expect( $group.get('selected') ).to.be.a.null;

                        }
                    })
                    .div({"class": "i-example-test sign-2599115567281842"})
                .end(2)
                .div({"class": "i-example-code sign-3267283507157117"})
                    .act(function() {
                        $radiocheck = $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({'radiocheck':true}));
                    })
                    .act(function() {
                        tests['2488082235213369'] = function(){

                            expect( $radiocheck ).to.be.an.instanceof(Backbone.Model);

                        }
                    })
                    .div({"class": "i-example-test sign-2488082235213369"})
    .end(5);
};

$C.tpl["i-button-group-example__array"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $group, $radiocheck;
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-3140221331268549"})
                .div({"class": "i-example-code sign-9854313586838543"})
                    .act(function() {
                        $group = $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), (['One','Two','Three']));
                    })
                    .act(function() {
                        tests['8107704240828753'] = function(){

                            expect( $group ).to.be.an.instanceof(Backbone.Model);

                        }
                    })
                    .div({"class": "i-example-test sign-8107704240828753"})
                .end(2)
                .div({"class": "i-example-code sign-3013448074925691"})
                    .act(function() {
                        $radiocheck = $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), (['One','Two','Three']), ({'radiocheck':true}));
                    })
                    .act(function() {
                        tests['43950922158546746'] = function(){

                            expect( $radiocheck ).to.be.an.instanceof(Backbone.Model);

                        }
                    })
                    .div({"class": "i-example-test sign-43950922158546746"})
    .end(5);
};

$C.tpl["i-button-group-example__collection"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $collection, $group;
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-04744499642401934"})
                .div({"class": "i-example-code sign-9859151691198349"})
                    .act(function $C_i_button_group_example__collection_117_25() { $collection = (
                                                new Backbone.Collection([
                                                    {'label': 'One', 'value': '1'},
                                                    {'label': 'Two', 'value': '2'},
                                                    {'label': 'Three', 'value': '3'}
                                                ])
                                            ); })
                .end()
                .div({"class": "i-example-code sign-37998253433033824"})
                    .act(function() {
                        $group = $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ($collection));
                    })
                    .act(function() {
                        tests['5464724292978644'] = function(){

                            expect( $group ).to.be.an.instanceof(Backbone.Model);

                        }
                    })
                    .div({"class": "i-example-test sign-5464724292978644"})
    .end(5);
};

$C.tpl["i-button-group-example__object"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $object, $group;
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-624585728161037"})
                .div({"class": "i-example-code sign-9702968993224204"})
                    .act(function $C_i_button_group_example__object_142_25() { $object = ({
                                                "buttons": "One; Two; Three",
                                                "delim":   "; "
                                            }); })
                .end()
                .div({"class": "i-example-code sign-30410388205200434"})
                    .act(function() {
                        $group = $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ($object));
                    })
                    .act(function() {
                        tests['9511020581703633'] = function(){

                            expect( $group ).to.be.an.instanceof(Backbone.Model);

                        }
                    })
                    .div({"class": "i-example-test sign-9511020581703633"})
    .end(5);
};

$C.tpl["i-button-group-example__sizing"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-4543332299217582"})
                .div({"class": "i-example-code sign-2453942543361336"})
                    .div({"class": "i-example__button-sizing"})
                        .div()
                            .span()
                                .text("M size")
                            .end()
                            .act(function() {
                                $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({'size':'M'}));
                            })
                        .end()
                        .div()
                            .span()
                                .text("S size")
                            .end()
                            .act(function() {
                                $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({'size':'S'}));
                            })
                        .end()
                        .div()
                            .span()
                                .text("XS size")
                            .end()
                            .act(function() {
                                $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({'size':'XS'}));
                            })
    .end(6);
};

$C.tpl["i-button-group-example__customization"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-17188629088923335"})
                .div({"class": "i-example-code sign-7403054779861122"})
                    .act(function() {
                        $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ([
                                                    {'label': 'One', 'value': '1'},
                                                    {'label': 'Two', 'value': '2', 'disabled': true},
                                                    {'label': 'Three', 'value': '3', 'loading': true}
                                                ]), ({
                                                    'radiocheck': true,
                                                    'template':'i-button__custom'
                                                }));
                    })
                .end()
                .div({"class": "i-example-code sign-46595397125929594"})
                    .act(function() {
                        $C._tpl["i::button-group"].call(new $ConkittyEnvClass(this), ({
                                                        'size': 'S',
                                                        'template':'i-button__custom',
                                                        'buttons':[
                                                            {'label': 'One', 'value': '1'},
                                                            {'label': 'Two', 'value': '2'},
                                                            {'label': 'Three', 'value': '3'}
                                                        ]}));
                    })
    .end(4);
};

$C.tpl["i-input-example"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .ul({"class": "i-example__list"})
            .li({"class": "i-example__list-item"})
                .div({"class": "i-example-code sign-3715799795463681"})
                .end()
                .act(function() {
                    $C.tpl["i-input-example__options"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-input-example__sizing"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-input-example__value"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-input-example__disabled"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-input-example__placeholder"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-input-example__delay"].call(new $ConkittyEnvClass(this));
                })
    .end(3);
};

$C.tpl["i-input-example__options"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .elem("h4")
            .text("Options")
        .end()
        .p()
            .elem("dl")
                .elem("dt")
                    .text("size")
                .end()
                .elem("dd")
                    .text("String. L, M or S. M by default")
                .end()
                .elem("dt")
                    .text("placeholder")
                .end()
                .elem("dd")
                    .text("String")
                .end()
                .elem("dt")
                    .text("value")
                .end()
                .elem("dd")
                    .text("String, Number")
                .end()
                .elem("dt")
                    .text("disabled")
                .end()
                .elem("dd")
                    .text("Boolean. false by default")
                .end()
                .elem("dt")
                    .text("debounce")
                .end()
                .elem("dd")
                    .text("Number. Debounce value in milliseconds, 0 by default")
    .end(4);
};

$C.tpl["i-input-example__sizing"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $Lsize, $Msize, $Ssize;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-7695550546050072"})
            .div({"class": "i-example-code sign-026951513718813658"})
                .div({"class": "i-example__button-sizing"})
                    .div()
                        .act(function() { $Lsize = this; })
                        .attr("style", "width:32%")
                        .act(function() {
                            $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'size': 'L', 'placeholder':'L size'}));
                        })
                    .end()
                    .div()
                        .act(function() { $Msize = this; })
                        .attr("style", "width:32%")
                        .act(function() {
                            $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'size': 'M', 'placeholder':'M size'}));
                        })
                    .end()
                    .div()
                        .act(function() { $Ssize = this; })
                        .attr("style", "width:32%")
                        .act(function() {
                            $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'size': 'S', 'placeholder':'S size'}));
                        })
            .end(3)
            .act(function() {
                tests['6174942513462156'] = function(){

                    var $L  = $($Lsize.firstChild),
                        $M  = $($Msize.firstChild),
                        $S  = $($Ssize.firstChild);

                    expect( $L.hasClass('i-input__size-L')  ).to.be.true;
                    expect( $M.hasClass('i-input__size-M')  ).to.be.true;
                    expect( $S.hasClass('i-input__size-S')  ).to.be.true;

                    expect( $L.height() > $M.height()  ).to.be.true;
                    expect( $M.height() > $S.height()  ).to.be.true;

                }
            })
            .div({"class": "i-example-test sign-6174942513462156"})
    .end(3);
};

$C.tpl["i-input-example__value"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $input, $node, $nodeInput, $nodeClear;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-4511786724906415"})
            .div({"class": "i-example-code sign-4358371151611209"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $input = $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'value': 'value'}));
                    })
                .end()
                .act(function $C_i_input_example__value_77_21() { $node = ($($container.firstChild)); })
                .act(function $C_i_input_example__value_78_21() { $nodeInput = ($node.find('.i-input__input')); })
                .act(function $C_i_input_example__value_79_21() { $nodeClear = ($node.find('.i-input__clear')); })
            .end()
            .act(function() {
                tests['17149696522392333'] = function(done){

                    var
                        checkValue = function(){

                            expect( $input ).to.be.an.instanceof(Backbone.Model);

                            expect( $input.get('value') ).to.be.equal('value');

                            expect( $nodeInput.val() ).to.be.equal('value');

                            var clearStyle = getComputedStyle( $nodeClear.get(0) , null);

                            expect( clearStyle.display !== 'none'  ).to.be.true;
                        },

                        checkClear = function($input, value){

                            expect( value ).to.be.equal('');

                             expect( $nodeInput.val() ).to.be.equal('');

                            expect( $node.hasClass('i-input__empty') ).to.be.true;

                            expect( $nodeInput.get(0) === document.activeElement ).to.be.true;
                            var clearStyle = getComputedStyle( $nodeClear.get(0) , null);
                            expect( clearStyle.display === 'none'  ).to.be.true;

                            $input.once('change:value', checkEnd);

                            $input.set('value', 'value');
                        },
                        checkEnd = function($input, value){
                            $nodeInput.blur();
                            checkValue();
                            done();
                        };

                    checkValue();

                    $input.once('change:value', checkClear);

                    $nodeClear.trigger('click');

                }
            })
            .div({"class": "i-example-test sign-17149696522392333"})
    .end(3);
};

$C.tpl["i-input-example__disabled"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $input, $node, $nodeInput, $nodeClear;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-8228029068559408"})
            .div({"class": "i-example-code sign-06641866872087121"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $input = $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'value': 'value', 'disabled': true}));
                    })
                .end()
                .act(function $C_i_input_example__disabled_135_21() { $node = ($($container.firstChild)); })
                .act(function $C_i_input_example__disabled_136_21() { $nodeInput = ($node.find('.i-input__input')); })
                .act(function $C_i_input_example__disabled_137_21() { $nodeClear = ($node.find('.i-input__clear')); })
            .end()
            .act(function() {
                tests['6708252087701112'] = function(){

                    expect( $input ).to.be.an.instanceof(Backbone.Model);
                    expect( $input.get('disabled') ).to.be.true();
                    var clearStyle = getComputedStyle( $nodeClear.get(0) , null);
                    expect( clearStyle.display === 'none'  ).to.be.true;
                    expect( $nodeInput.is("[disabled]") ).to.be.true;
                    expect( $nodeInput.get(0).disabled  ).to.be.true;
                    expect( $node.hasClass('i-input__disabled') ).to.be.true;
                    $input.set('disabled', false);
                    clearStyle = getComputedStyle( $nodeClear.get(0) , null);
                    expect( clearStyle.display !== 'none'  ).to.be.true;
                    expect( $nodeInput.is("[disabled]") ).to.be.false;
                    expect( $nodeInput.get(0).disabled  ).to.be.false;
                    expect( $node.hasClass('i-input__disabled') ).to.be.false;

                }
            })
            .div({"class": "i-example-test sign-6708252087701112"})
    .end(3);
};

$C.tpl["i-input-example__placeholder"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $input, $nodeInput;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-9515512727666646"})
            .div({"class": "i-example-code sign-6424738781061023"})
                .span()
                    .act(function() { $container = this; })
                    .act(function() {
                        $input = $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'placeholder': 'placeholder'}));
                    })
                .end()
                .act(function $C_i_input_example__placeholder_165_21() { $nodeInput = ($($container).find('.i-input__input')); })
            .end()
            .act(function() {
                tests['14361683558672667'] = function(){

                    expect( $input ).to.be.an.instanceof(Backbone.Model);
                    expect( $input.get('placeholder') ).to.be.equal('placeholder');
                    expect( $nodeInput.is("[placeholder]") ).to.be.true;
                    expect( $nodeInput.get(0).placeholder  ).to.be.equal('placeholder');
                    $input.set('placeholder', '');
                    expect( $input.get('placeholder') ).to.be.equal('');
                    expect( $nodeInput.is("[placeholder]") ).to.be.false;
                    expect( $nodeInput.get(0).placeholder  ).to.be.equal('');

                }
            })
            .div({"class": "i-example-test sign-14361683558672667"})
    .end(3);
};

$C.tpl["i-input-example__delay"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container_0, $input_0, $nodeInput_0, $container_1000, $input_1000, $nodeInput_1000;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-4692459595389664"})
            .div({"class": "i-example-code sign-4311523833312094"})
                .div({"class": "i-example__button-sizing"})
                    .span()
                        .act(function() { $container_0 = this; })
                        .act(function() {
                            $input_0 = $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'placeholder': '0 debounce'}));
                        })
                    .end()
                    .act(function $C_i_input_example__delay_189_25() { $nodeInput_0 = ($($container_0).find('.i-input__input')); })
                    .span()
                        .act(function() { $container_1000 = this; })
                        .act(function() {
                            $input_1000 = $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({'placeholder': '1000 debounce', 'debounce': 1000}));
                        })
                    .end()
                    .act(function $C_i_input_example__delay_192_25() { $nodeInput_1000 = ($($container_1000).find('.i-input__input')); })
            .end(2)
            .act(function() {
                tests['5776089665014297'] = function(done){

                    var
                        count       = 10,

                        step        = 50,

                        delay       = 1000,

                        action_0    = sinon.spy(),
                        action_1000 = sinon.spy(),

                        i = 0,

                        test = function(){
                            expect( action_0   .callCount ).to.be.equal( 10 );
                            expect( action_1000.callCount ).to.be.equal(  1 );
                            expect( action_0.calledBefore(action_1000) ).to.be.true;
                            done();
                        },

                        trigger = function(i, end){
                            $nodeInput_0.val("#" + i);
                            $nodeInput_0.trigger('input');
                            $nodeInput_1000.val("#" + i);
                            $nodeInput_1000.trigger('input');

                            if (end) {
                                setTimeout(test, delay);
                            }
                        };

                    $input_0   .on('change:value', action_0);
                    $input_1000.on('change:value', action_1000);

                    while(++i <= count){
                        setTimeout(trigger, i * step, i, i === count);
                    }

                }
            })
            .div({"class": "i-example-test sign-5776089665014297"})
    .end(3);
};

$C.tpl["i-popup-example"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $container, $owner, $sibling, $popup;
    return $C($ConkittyEnv.p)
        .ul({"class": "i-example__list"})
            .li({"class": "i-example__list-item"})
                .p()
                    .text("Popup used in many block elements.")
                .end()
                .elem("h4")
                    .text("Options")
                .end()
                .p()
                    .elem("dl")
                        .elem("dt")
                            .text("owner")
                        .end()
                        .elem("dd")
                            .text("DOM element. document.body by default")
                        .end()
                        .elem("dt")
                            .text("mode")
                        .end()
                        .elem("dd")
                            .text("click or hover")
                        .end()
                        .elem("dt")
                            .text("side")
                        .end()
                        .elem("dd")
                            .text("top, right, bottom or left. bottom by default")
                        .end()
                        .elem("dt")
                            .text("align")
                        .end()
                        .elem("dd")
                            .text("start, center or end. start by default")
                        .end()
                        .elem("dt")
                            .text("adaptive")
                        .end()
                        .elem("dd")
                            .text("Boolean or space-separated ordered subset of top, right, bottom and left. false by default")
                        .end()
                        .elem("dt")
                            .text("sideOffset")
                        .end()
                        .elem("dd")
                            .text("CSS length value. .5em by default")
                        .end()
                        .elem("dt")
                            .text("alignOffset")
                        .end()
                        .elem("dd")
                            .text("CSS length value. 1px by default")
                        .end()
                        .elem("dt")
                            .text("tail")
                        .end()
                        .elem("dd")
                            .text("Boolean. false by default")
                        .end()
                        .elem("dt")
                            .text("tailWidth")
                        .end()
                        .elem("dd")
                            .text("CSS length value. .5em by default")
                        .end()
                        .elem("dt")
                            .text("tailHeight")
                        .end()
                        .elem("dd")
                            .text("CSS length value. 1px by default")
                        .end()
                        .elem("dt")
                            .text("tailAlign")
                        .end()
                        .elem("dd")
                            .text("start, center or end. start by default")
                        .end()
                        .elem("dt")
                            .text("tailOffset")
                        .end()
                        .elem("dd")
                            .text("CSS length value. 1px by default")
                        .end()
                        .elem("dt")
                            .text("autoclose")
                        .end()
                        .elem("dd")
                            .text("Boolean. true by default")
                        .end()
                        .elem("dt")
                            .text("delay")
                        .end()
                        .elem("dd")
                            .text("Time in ms. 500 by default")
            .end(4)
            .li({"class": "i-example__list-item"})
                .div({"class": "i-example-suite sign-7183356166351587"})
                    .div({"class": "i-example-code sign-07273752987384796"})
                        .div({"class": "container"})
                            .act(function() { $container = this; })
                            .span({"class": "i-popup-example__owner"})
                                .act(function() { $owner = this; })
                                .text("owner")
                                .span({"class": "sibling"})
                                    .act(function() { $sibling = this; })
                                .end()
                                .act(function() {
                                    $popup = $C._tpl["i::popup"].call(new $ConkittyEnvClass(
                                        this,
                                        function() {
                                            return $C()
                                                .div({"class": "i-popup-example__content"})
                                                    .text("some text")
                                            .end(2); }
                                    ), ({
                                                                            'owner': this,
                                                                            'mode': 'click',
                                                                            'tail': 'true',
                                                                            'side': 'top',
                                                                            'adaptive': 'left bottom',
                                                                        }));
                                })
                        .end(2)
                        .act(function() {
                            tests['07478004577569664'] = function(){

                                $popup.show();
                                $($sibling).remove();
                                expect(document.body.contains($popup.el)).to.be.true();
                                $($container).parent().empty();
                                expect(document.body.contains($popup.el)).to.be.false();

                            }
                        })
                        .div({"class": "i-example-test sign-07478004577569664"})
            .end(4)
            .li({"class": "i-example__list-item"})
                .div({"class": "i-example-suite sign-25715856440365314"})
                    .div({"class": "i-example-code sign-03923078812658787"})
                        .span({"class": "i-popup-example__owner"})
                            .text("owner")
                            .act(function() {
                                $C._tpl["i::popup"].call(new $ConkittyEnvClass(
                                    this,
                                    function() {
                                        return $C()
                                            .div({"class": "i-popup-example__content"})
                                                .span({"class": "i-popup-example__owner"})
                                                    .text("owner")
                                                    .act(function() {
                                                        $C._tpl["i::popup"].call(new $ConkittyEnvClass(
                                                            this,
                                                            function() {
                                                                return $C()
                                                                    .div({"class": "i-popup-example__content"})
                                                                        .text("some text")
                                                                .end(2); }
                                                        ), ({
                                                                                                        'owner': this,
                                                                                                        'mode': 'click',
                                                                                                        'side': 'right',
                                                                                                        'align': 'start'
                                                                                                    }));
                                                    })
                                        .end(3); }
                                ), ({
                                                                    'owner': this,
                                                                    'mode': 'click'
                                                                }));
                            })
            .end(4)
            .li({"class": "i-example__list-item"})
                .div({"class": "i-example-suite sign-9278353694826365"})
                    .div({"class": "i-example-code sign-17411022377200425"})
                        .span({"class": "i-popup-example__owner"})
                            .text("owner")
                            .act(function() {
                                $C._tpl["i::popup"].call(new $ConkittyEnvClass(
                                    this,
                                    function() {
                                        return $C()
                                            .div({"class": "i-popup-example__content"})
                                                .text("some text")
                                        .end(2); }
                                ), ({
                                                                    'owner': this,
                                                                    'mode': 'hover'
                                                                }));
                            })
    .end(6);
};

$C.tpl["i-select__view"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
    .end();
};

$C.tpl["i-select__view-button__check"] = function($selected, $select) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $arr, $option;
    return $C($ConkittyEnv.p)
        .act(function $C_i_select__view_button__check_5_5() { $arr = ($selected.split(',')); })
        .choose()
            .when(function $C_i_select__view_button__check_7_14() { return ($arr.length); })
                .each(function $C_i_select__view_button__check_8_26() { return ($arr); })
                    .act(function($C_) { $option = $C_; })
                    .act(function() {
                        $C.tpl["i-select__view-button"].call(new $ConkittyEnvClass(this), $option, $select, (true));
                    })
            .end(2)
            .otherwise()
                .act(function() {
                    $C.tpl["i-select__view-button"].call(new $ConkittyEnvClass(this), "empty", $select);
                })
    .end(3);
};

$C.tpl["i-select__view-button"] = function($selected, $select, $check) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $label, $delete;
    return $C($ConkittyEnv.p)
        .act(function $C_i_select__view_button_16_5() { $label = ($selected || 'empty'); })
        .div({"class": "i-select__view-button"})
            .span({"class": "i-select__view-button-label"})
                .text(function $C_i_select__view_button_19_13() { return ($label); })
            .end()
            .test(function $C_i_select__view_button_20_14() { return ($label!='empty'); })
                .span({"class": "i-select__view-button-delete"})
                    .act(function() { $delete = this; })
                    .text("×")
                .end()
                .act(function() {
                    $delete.addEventListener(
                        "mouseup",
                        function(e){
                            e.stopPropagation();
                            if($check){
                                $select.select($label);
                            } else {
                                $select.reset();
                            }
                        }
                    )

                })
    .end(3);
};

$C.tpl["i-select__view-option"] = function($model) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .div({"class": "i-select__view-option"})
            .text("→ ")
            .text(function $C_i_select__view_option_39_9() { return ($model.get('label')); })
            .text(" ←")
    .end(2);
};

$C.tpl["i-select-example"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .ul({"class": "i-example__list"})
            .li({"class": "i-example__list-item"})
                .p()
                    .text("Constructor can recognize following types of input data: String, Array, ")
                    .a()
                        .attr("href", "http://backbonejs.org/#Collection")
                        .text("Backbone.Collection")
                    .end()
                    .text(" and Object")
                .end()
                .div({"class": "i-example-code sign-6388605069369078"})
                .end()
                .act(function() {
                    $C.tpl["i-select-example__options"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-select-example__string"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-select-example__array"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-select-example__collection"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-select-example__object"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-select-example__disabled"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-select-example__customization"].call(new $ConkittyEnvClass(this));
                })
    .end(3);
};

$C.tpl["i-select-example__options"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .elem("h4")
            .text("Options")
        .end()
        .p()
            .elem("dl")
                .elem("dt")
                    .text("size")
                .end()
                .elem("dd")
                    .text("String. Values: S, M (default), L")
                .end()
                .elem("dt")
                    .text("placeholder")
                .end()
                .elem("dd")
                    .text("String. none (default)")
                .end()
                .elem("dt")
                    .text("options")
                .end()
                .elem("dd")
                    .text("String, Array, Object or Backbone.Collection")
                .end()
                .elem("dt")
                    .text("mode")
                .end()
                .elem("dd")
                    .text("String. Values: radio (default) or check")
                .end()
                .elem("dt")
                    .text("delim")
                .end()
                .elem("dd")
                    .text("String. ',' by default")
                .end()
                .elem("dt")
                    .text("disabled")
                .end()
                .elem("dd")
                    .text("Boolean. false by default")
                .end()
                .elem("dt")
                    .text("viewButton")
                .end()
                .elem("dd")
                    .text("Template name for i-select button customization.")
                .end()
                .elem("dt")
                    .text("viewOption")
                .end()
                .elem("dd")
                    .text("Template name for i-select option customization.")
    .end(4);
};

$C.tpl["i-select-example__string"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $stringSelect, $stringCheckSelect;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-8456085852812976"})
            .div({"class": "i-example-code sign-7595571521669626"})
                .act(function() {
                    $stringSelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ('One,Two,Three'));
                })
                .act(function() {
                    tests['5295012472197413'] = function(){

                        expect($stringSelect.get("selected"))
                            .to.be.a("string").and
                            .to.be.empty();
                        expect($stringSelect.get("label"))
                            .to.equal($stringSelect.get("placeholder"));
                        $stringSelect.select("One");
                        expect($stringSelect.get("selected"))
                            .to.be.a("string").and
                            .to.equal("One");
                        expect($stringSelect.get("label"))
                            .to.equal("One");
                        $stringSelect.select("Two");
                        expect($stringSelect.get("selected"))
                            .to.be.a("string").and
                            .to.equal("Two");
                        expect($stringSelect.get("label"))
                            .to.equal("Two");
                        $stringSelect.reset();
                        expect($stringSelect.get("selected"))
                            .to.be.a("string").and
                            .to.be.empty();
                        expect($stringSelect.get("label"))
                            .to.equal($stringSelect.get("placeholder"));

                    }
                })
                .div({"class": "i-example-test sign-5295012472197413"})
            .end(2)
            .div({"class": "i-example-code sign-678288007620722"})
                .act(function() {
                    $stringCheckSelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ("One, Two, Three"), ({"mode":"check", "delim": ", "}));
                })
                .act(function() {
                    tests['4255302152596414'] = function(){

                        expect($stringCheckSelect.get("selected"))
                            .to.be.a("string").and
                            .to.be.empty();
                        expect($stringCheckSelect.get("label"))
                            .to.equal($stringCheckSelect.get("placeholder"));
                        $stringCheckSelect.select("One");
                        $stringCheckSelect.select("Two");
                        expect($stringCheckSelect.get("selected"))
                            .to.be.a("string").and
                            .to.be.equal("One, Two").and
                            .to.be.equal($stringCheckSelect.get("label"));
                        $stringCheckSelect.reset();
                        expect($stringCheckSelect.get("selected"))
                            .to.be.a("string").and
                            .to.be.empty();

                    }
                })
                .div({"class": "i-example-test sign-4255302152596414"})
    .end(4);
};

$C.tpl["i-select-example__array"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $arraySelect, $arrayCheckSelect;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-7498946262057871"})
            .div({"class": "i-example-code sign-9168798851314932"})
                .act(function() {
                    $arraySelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), (["One", "Two", "Three"]));
                })
                .act(function() {
                    tests['17673998419195414'] = function(){

                        expect($arraySelect.get("selected"))
                            .to.be.a('null');
                        expect($arraySelect.get("label"))
                            .to.equal($arraySelect.get("placeholder"));
                        $arraySelect.select("One");
                        expect($arraySelect.get("selected"))
                            .to.be.a("string").and
                            .to.be.equal("One");
                        $arraySelect.select("Two");
                        expect($arraySelect.get("selected"))
                            .to.be.an("string").and
                            .to.be.deep.equal("Two");
                        $arraySelect.reset();
                        expect($arraySelect.get("selected"))
                            .to.be.a('null');

                    }
                })
                .div({"class": "i-example-test sign-17673998419195414"})
            .end(2)
            .div({"class": "i-example-code sign-5935200427193195"})
                .act(function() {
                    $arrayCheckSelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), (["One", "Two", "Three"]), ({"mode":"check"}));
                })
                .act(function() {
                    tests['18185243476182222'] = function(){

                        expect($arrayCheckSelect.get("selected"))
                            .to.be.an("array").and
                            .to.be.empty();
                        $arrayCheckSelect.select("One");
                        $arrayCheckSelect.select("Two");
                        expect($arrayCheckSelect.get("selected"))
                            .to.be.an("array").and
                            .to.be.deep.equal(["One", "Two"]);
                        $arrayCheckSelect.reset();
                        expect($arrayCheckSelect.get("selected"))
                            .to.be.an("array").and
                            .to.be.empty();

                    }
                })
                .div({"class": "i-example-test sign-18185243476182222"})
    .end(4);
};

$C.tpl["i-select-example__collection"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $collection, $collectionSelect, $collectionCheckSelect;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-909336801385507"})
            .div({"class": "i-example-code sign-2793591187801212"})
                .act(function $C_i_select_example__collection_174_21() { $collection = (new Backbone.Collection([
                                                    {"value":"1", "label":"One"},
                                                    {"value":"2", "label":"Two"},
                                                    {"value":"3", "label":"Three"}
                                                ])); })
            .end()
            .div({"class": "i-example-code sign-9606387589592487"})
                .act(function() {
                    $collectionSelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ($collection));
                })
                .act(function() {
                    tests['7123433903325349'] = function(){

                        expect($collectionSelect.get("selected"))
                            .to.be.a('null');
                        $collectionSelect.select($collection.at(0))
                        expect($collectionSelect.get("selected"))
                            .to.be.an.instanceof(Backbone.Model).and
                            .to.be.equal($collection.at(0));
                        $collection.reset([
                            {"value":"1", "label":"One"},
                            {"value":"2", "label":"Two"},
                            {"value":"3", "label":"Four"}
                        ]);
                        $collectionSelect.reset();
                        expect($collectionSelect.get("selected"))
                            .to.be.a('null');

                    }
                })
                .div({"class": "i-example-test sign-7123433903325349"})
            .end(2)
            .div({"class": "i-example-code sign-8805828157346696"})
                .act(function() {
                    $collectionCheckSelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ($collection), ({"mode":"check"}));
                })
                .act(function() {
                    tests['8443173631094396'] = function(){

                        expect($collectionCheckSelect.get("selected"))
                            .to.be.an('array').and
                            .to.be.empty();
                        $collectionCheckSelect.select($collection.at(0))
                        $collectionCheckSelect.select($collection.at(1))
                        expect($collectionCheckSelect.get("selected"))
                            .to.be.an('array').and
                            .to.be.deep.equal([$collection.at(0),$collection.at(1)]);
                        $collectionCheckSelect.reset();
                        expect($collectionCheckSelect.get("selected"))
                            .to.be.an('array').and
                            .to.be.empty();

                    }
                })
                .div({"class": "i-example-test sign-8443173631094396"})
    .end(4);
};

$C.tpl["i-select-example__object"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-4057472723070532"})
            .div({"class": "i-example-code sign-4404793633148074"})
                .act(function() {
                    $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ({
                                            "options":      "One; Two; Three",
                                            "size":         "S",
                                            "placeholder":  "numbers",
                                            "delim":        "; ",
                                            "mode":         "check"
                                        }));
                })
    .end(3);
};

$C.tpl["i-select-example__disabled"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-9212892642244697"})
            .div({"class": "i-example-code sign-6705517924856395"})
                .act(function() {
                    $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({'disabled':true}));
                })
    .end(3);
};

$C.tpl["i-select-example__customization"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $radioSelect, $checkSelect;
    return $C($ConkittyEnv.p)
        .div({"class": "i-example-suite sign-17107653827406466"})
            .p()
                .text("It's easy to modify ")
                .b()
                    .text("i-select")
                .end()
                .text(" view with custom templates. ")
            .end()
            .div({"class": "i-example-code sign-08118870574980974"})
            .end()
            .div({"class": "i-example-code sign-3906073940452188"})
                .act(function() {
                    $radioSelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), (
                                            {
                                                "options":    "One,Two,Three",
                                                "viewButton": "i-select__view-button",
                                                "viewOption": "i-select__view-option"
                                            }
                                        ));
                })
                .act(function() {
                    tests['35561718279495835'] = function(){

                        expect( $radioSelect ).to.be.an('object');
                        expect( $radioSelect ).to.be.an.instanceof(Backbone.Model);

                    }
                })
                .div({"class": "i-example-test sign-35561718279495835"})
            .end(2)
            .div({"class": "i-example-code sign-09879318159073591"})
                .act(function() {
                    $checkSelect = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), (
                                            {
                                                "options":    "One,Two,Three",
                                                "viewButton": "i-select__view-button",
                                                "viewOption": "i-select__view-option",
                                                "mode":       "check"
                                            }
                                        ));
                })
                .act(function() {
                    tests['20478370832279325'] = function(){

                        expect( $checkSelect ).to.be.an('object')

                    }
                })
                .div({"class": "i-example-test sign-20478370832279325"})
    .end(4);
};

$C.tpl["i-suggest-example"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .ul({"class": "i-example__list"})
            .li({"class": "i-example__list-item"})
                .p()
                    .text("The i::suggest contains some js glue between i::input and i::select. ")
                    .text("Suggest object also provides access to 'data' object via corresponding model's property. ")
                    .text("Constructor can recognize following types of input data: String, Array, ")
                    .a()
                        .attr("href", "http://backbonejs.org/#Collection")
                        .text("Backbone.Collection")
                    .end()
                    .text(" and Object")
                .end()
                .div({"class": "i-example-code sign-8436500406824052"})
                .end()
                .act(function() {
                    $C.tpl["i-suggest-example__options"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-suggest-example__data"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-suggest-example__url"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-suggest-example__sizing"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $C.tpl["i-suggest-example__customization"].call(new $ConkittyEnvClass(this));
                })
    .end(3);
};

$C.tpl["i-suggest-example__options"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .elem("h4")
                .text("Options")
            .end()
            .p()
                .elem("dl")
                    .elem("dt")
                        .text("delim")
                    .end()
                    .elem("dd")
                        .text("String. ',' by default")
                    .end()
                    .elem("dt")
                        .text("placeholder")
                    .end()
                    .elem("dd")
                        .text("Placeholder for input. Empty string by default")
                    .end()
                    .elem("dt")
                        .text("option")
                    .end()
                    .elem("dd")
                        .text("If your suggested data contains neither 'label', nor 'value' fields you can explicitly specify a field 'name' or callback to use instead.")
                    .end()
                    .elem("dt")
                        .text("min")
                    .end()
                    .elem("dd")
                        .text("minimum number of characters required to request data")
                    .end()
                    .elem("dt")
                        .text("viewButton")
                    .end()
                    .elem("dd")
                        .text("Template name for i-select button customization.")
                    .end()
                    .elem("dt")
                        .text("viewOption")
                    .end()
                    .elem("dd")
                        .text("Template name for i-select option customization.")
    .end(5);
};

$C.tpl["i-suggest-example__data"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $suggestString, $suggestArray;
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-9490802718792111"})
                .div({"class": "i-example-code sign-5212007001973689"})
                    .act(function() {
                        $suggestString = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ('One,Two,Three'));
                    })
                    .act(function() {
                        tests['050950635923072696'] = function(){

                            expect( $suggestString ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestString.get('data') ).to.be.an.instanceof(Backbone.Collection);

                        }
                    })
                    .div({"class": "i-example-test sign-050950635923072696"})
                .end(2)
                .div({"class": "i-example-code sign-13817612058483064"})
                    .act(function() {
                        $suggestArray = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), (['One','Two','Three']));
                    })
                    .act(function() {
                        tests['7641917336732149'] = function(){

                            expect( $suggestArray ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestArray.get('data') ).to.be.an.instanceof(Backbone.Collection);

                        }
                    })
                    .div({"class": "i-example-test sign-7641917336732149"})
    .end(5);
};

$C.tpl["i-suggest-select"] = function($model) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $options, $select;
    $C($ConkittyEnv.p)
        .act(function $C_i_suggest_select_26_5() { $options = ({
                "options":    $model.get('data'),
                "size":       $model.get('size'),
                "viewButton": $model.get('viewButton'),
                "viewOption": $model.get('viewOption')
            }); })
        .act(function() {
            $select = $C._tpl["i::select"].call(new $ConkittyEnvClass(this), ($options));
        })
        .act(function() { $ConkittyTemplateRet = $select; })
    .end();
    return $ConkittyTemplateRet;
};

$C.tpl["i-suggest-example__url"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $suggestURL, $suggestURL_input;
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-0946972796227783"})
                .text("Suggest element by URL with remote data request.")
                .div({"class": "i-example-code sign-5939098054077476"})
                    .act(function() {
                        $suggestURL = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ('./examples/i-suggest/capitals.json'));
                    })
                    .act(function() {
                        tests['408396131824702'] = function(){

                            expect( $suggestURL ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestURL.get('data') ).to.be.an.instanceof(Backbone.Collection);
                            if ($suggestURL.get('data').length === 0) {
                                describe('$suggestURL check async', function(){
                                    it('on fetch', function(done){
                                        $suggestURL.get('data').once(
                                            'sync',
                                            function(){
                                                expect( $suggestURL.get('data').length ).to.be.ok;
                                                done();
                                            }
                                        );
                                    });
                                });
                            }

                        }
                    })
                    .div({"class": "i-example-test sign-408396131824702"})
                .end(2)
                .div({"class": "i-example-code sign-6071819430217147"})
                    .act(function() {
                        $suggestURL_input = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ({
                                                    'data': './examples/i-suggest/capitals.json?search=%%input%%',
                                                    'min': 1
                                                }));
                    })
                    .act(function() {
                        tests['07260249205864966'] = function(){

                            expect( $suggestURL_input ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestURL_input.get('data') ).to.be.an.instanceof(Backbone.Collection);

                        }
                    })
                    .div({"class": "i-example-test sign-07260249205864966"})
    .end(5);
};

$C.tpl["i-suggest-example__sizing"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-8131987708620727"})
                .div({"class": "i-example-code sign-37981195584870875"})
                    .div({"class": "i-example__button-sizing"})
                        .div()
                            .attr("style", "width:32%")
                            .act(function() {
                                $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({"size": "L", "placeholder": "L-size"}));
                            })
                        .end()
                        .div()
                            .attr("style", "width:32%")
                            .act(function() {
                                $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({"size": "M", "placeholder": "M-size"}));
                            })
                        .end()
                        .div()
                            .attr("style", "width:32%")
                            .act(function() {
                                $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ('One,Two,Three'), ({"size": "S", "placeholder": "S-size"}));
                            })
    .end(6);
};

$C.tpl["i-suggest-example__customization"] = function() {
    var $ConkittyEnv = $ConkittyGetEnv(this), $suggestURL__country, $suggestURL__func, $suggestCustom;
    return $C($ConkittyEnv.p)
        .li({"class": "i-example__list-item"})
            .div({"class": "i-example-suite sign-43125803070142865"})
                .div({"class": "i-example-code sign-2256254197563976"})
                    .act(function() {
                        $suggestURL__country = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ({
                                                    'data': './examples/i-suggest/capitals.json',
                                                    'option': 'country'
                                                }));
                    })
                    .act(function() {
                        tests['8097251660656184'] = function(){

                            expect( $suggestURL__country ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestURL__country.get('data') ).to.be.an.instanceof(Backbone.Collection);

                        }
                    })
                    .div({"class": "i-example-test sign-8097251660656184"})
                .end(2)
                .div({"class": "i-example-code sign-1294648691546172"})
                    .act(function() {
                        $suggestURL__func = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ({
                                                    'data': './examples/i-suggest/capitals.json',
                                                    'option': function(option){
                                                        return option.get('capital') + " " + option.get('code');
                                                    }
                                                }));
                    })
                    .act(function() {
                        tests['7673459788784385'] = function(){

                            expect( $suggestURL__func ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestURL__func.get('data') ).to.be.an.instanceof(Backbone.Collection);

                        }
                    })
                    .div({"class": "i-example-test sign-7673459788784385"})
                .end(2)
                .div({"class": "i-example-code sign-5299931555055082"})
                    .act(function() {
                        $suggestURL__func = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ({
                                                    'data': './examples/i-suggest/capitals.json',
                                                    'filter': function(option, input){
                                                        var EU  = !!option.get("EU"),
                                                            val = option.get('capital').toLowerCase(),
                                                            str = input.toLowerCase();
                                                        return EU && (val.indexOf(str) === 0);
                                                    },
                                                    'option': function(option){
                                                        return option.get('code') + " " + option.get('capital');
                                                    }
                                                }));
                    })
                    .act(function() {
                        tests['6028155446983874'] = function(){

                            expect( $suggestURL__func ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestURL__func.get('data') ).to.be.an.instanceof(Backbone.Collection);

                        }
                    })
                    .div({"class": "i-example-test sign-6028155446983874"})
                .end(2)
                .div({"class": "i-example-code sign-3628926486708224"})
                .end()
                .div({"class": "i-example-code sign-15694607351906598"})
                    .act(function() {
                        $suggestCustom = $C._tpl["i::suggest"].call(new $ConkittyEnvClass(this), ({
                                                    'data': './examples/i-suggest/capitals.json',
                                                    'viewButton': 'i-suggest__custom-button',
                                                    'viewOption': 'i-suggest__custom'
                                                }));
                    })
                    .act(function() {
                        tests['8045118672307581'] = function(){

                            expect( $suggestCustom ).to.be.an.instanceof(Backbone.Model);
                            expect( $suggestCustom.get('data') ).to.be.an.instanceof(Backbone.Collection);

                        }
                    })
                    .div({"class": "i-example-test sign-8045118672307581"})
    .end(5);
};

$C.tpl["i-suggest__custom-button"] = function($selected, $select) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $custom, $input;
    return $C($ConkittyEnv.p)
        .choose()
            .when(function $C_i_suggest__custom_button_3_14() { return ($selected); })
                .act(function() {
                    $custom = $C.tpl["i-suggest__custom"].call(new $ConkittyEnvClass(this), ($selected));
                })
                .act(function() {
                    $($custom).one(
                        'mousedown',
                        function(e){
                            e.stopPropagation();
                            $select.set("selected", void(0) );
                        }
                    );
                    $select.set('input', false);

                })
            .end()
            .otherwise()
                .act(function() {
                    $input = $C._tpl["i::input"].call(new $ConkittyEnvClass(this));
                })
                .act(function() {
                    $select.set('input', $input);


                })
    .end(3);
};

$C.tpl["i-suggest__custom"] = function($option) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $container;
    $C($ConkittyEnv.p)
        .div({"class": "i-suggest__custom"})
            .act(function() { $container = this; })
            .span({"class": "i-suggest__custom-capital"})
                .text(function $C_i_suggest__custom_25_13() { return ($option.get('capital')); })
            .end()
            .span({"class": "i-suggest__custom-code"})
                .text(function $C_i_suggest__custom_27_13() { return ($option.get('code')); })
        .end(2)
        .act(function() { $ConkittyTemplateRet = $container; })
    .end();
    return $ConkittyTemplateRet;
};

$C.tpl["i-select__button"] = function($button) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $select;
    return $C($ConkittyEnv.p)
        .act(function $C_i_select__button_53_5() { $select = ($button.get("select")); })
        .act(function() {
            $C.tpl[($select.get("viewButton"))].call(new $ConkittyEnvClass(this), ($select.get("selected")), ($select));
        })
    .end();
};

$C.tpl["i-suggest-input"] = function($selected, $select) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $input, $value;
    return $C($ConkittyEnv.p)
        .act(function $C_i_suggest_input_37_5() { $value = ($selected ? $select.getOptionLabel($selected) : ''); })
        .act(function() {
            $input = $C._tpl["i::input"].call(new $ConkittyEnvClass(this), ({
                    'value': $value,
                    'size': $select.get('size')
                }));
        })
        .act(function() {
            $select.set('input', $input);

        })
    .end();
};

$C.tpl["i-prism"] = function($code, $type) {
    var $ConkittyEnv = $ConkittyGetEnv(this);
    return $C($ConkittyEnv.p)
        .div({"class": "i-prism"})
            .elem("pre")
                .elem("code")
                    .attr("class", function $C_i_prism_9_24() { return ("language-" + $type); })
                    .text(function $C_i_prism_10_18() { return $code; })
    .end(4);
};

$C._tpl["i::button"] = function($data) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $block, $model, $button;
    $C($ConkittyEnv.p)
        .act(function $C_button_8_5() { $block = ("i-button"); })
        .act(function $C_button_9_5() { $model = (ns.button($data)); })
        .div()
            .act(function() { $button = this; })
            .attr("tabindex", "0")
            .attr("class", function $C_button_12_17() { return $block; })
            .attr("class", function() { return $ConkittyChange(this, ($block + "__size-" + $model.get("size"))); })
            .test(function $C_button_14_14() { return ($model.get("loading")); })
                .attr("class", function() { return $ConkittyChange(this, ($block+"__loading")); })
                .attr("disabled", "disabled")
                .attr("tabindex", "-1")
            .end()
            .test(function $C_button_18_14() { return ($model.get("action")); })
                .attr("class", function() { return $ConkittyChange(this, ($block+"__action")); })
            .end()
            .test(function $C_button_20_14() { return ($model.get("pressed")); })
                .attr("class", function() { return $ConkittyChange(this, ($block+"__pressed")); })
            .end()
            .test(function $C_button_22_14() { return ($model.get("checked")); })
                .attr("class", function() { return $ConkittyChange(this, ($block+"__checked")); })
            .end()
            .test(function $C_button_24_14() { return ($model.get("disabled")); })
                .attr("class", function() { return $ConkittyChange(this, ($block+"__disabled")); })
                .attr("disabled", "disabled")
                .attr("tabindex", "-1")
            .end()
            .div()
                .attr("class", function $C_button_29_20() { return ($block+"__face"); })
                .choose()
                    .when(function $C_button_31_22() { return ($model.get("template")); })
                        .act(function() {
                            $C.tpl[($model.get("template"))].call(new $ConkittyEnvClass(this), ($model));
                        })
                    .end()
                    .otherwise()
                        .act(function() {
                            $C.tpl["i-button__label"].call(new $ConkittyEnvClass(this), ($model));
                        })
        .end(4)
        .act(function() {
            new ns.views.button(
                {
                    'el': $button,
                    'model': $model
                }
            );

        })
        .act(function() { $ConkittyTemplateRet = $model; })
    .end();
    return $ConkittyTemplateRet;
};

$C._tpl["i::select"] = function($data, $options) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $block, $model, $popupOptions, $select, $button, $popup, $optionsList;
    $C($ConkittyEnv.p)
        .act(function $C_select_11_5() { $block = ("i-select"); })
        .act(function $C_select_12_5() { $model = (ns.select($data, $options)); })
        .act(function $C_select_13_5() { $popupOptions = ($options && $options.popup || {}); })
        .div()
            .act(function() { $select = this; })
            .attr("class", function $C_select_16_17() { return $block; })
            .attr("class", function() { return $ConkittyChange(this, ($block + "__size-" + $model.get("size"))); })
            .act(function() {
                $button = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), ({
                            'label':    $model.get('label'),
                            'size':     $model.get('size'),
                            'disabled': $model.get('disabled'),
                            'template': $model.get('viewButton') ? "i-select__button" : void(0),
                            'select':   $model
                        }));
            })
            .act(function() {
                $popupOptions.owner = this;
            })
            .act(function() {
                $popup = $C._tpl["i::popup"].call(new $ConkittyEnvClass(
                    this,
                    function() {
                        return $C()
                            .act(function() {
                                $optionsList = $C.tpl["i-select__options-list"].call(new $ConkittyEnvClass(this), ($model));
                            })
                        .end(); }
                ), $popupOptions);
            })
        .end()
        .act(function() {
            new ns.views.select(
                {
                    'el':       $select,
                    'model':    $model,
                    '$button':  $button,
                    '$popup':   $popup,
                    '$list':    $optionsList
                }
            )
        })
        .act(function() { $ConkittyTemplateRet = $model; })
    .end();
    return $ConkittyTemplateRet;
};

$C._tpl["i::popup"] = function($data) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $model, $popup, $view;
    $C($ConkittyEnv.p)
        .act(function $C_popup_5_5() { $model = ("get" in $data ? $data : new ns.models.popup($data)); })
        .div({"class": "i-popup"})
            .act(function() { $popup = this; })
            .test(function $C_popup_7_14() { return ($model.get('tail')); })
                .div({"class": "i-popup__tail"})
            .end(2)
            .act(function() { $ConkittyEnv.l(this); })
        .end()
        .act(function $C_popup_10_5() { $view = (new ns.views.popup({
                    'model': $model,
                    'el': $popup
                })); })
        .act(function() { $ConkittyTemplateRet = $view; })
    .end();
    return $ConkittyTemplateRet;
};

$C._tpl["i::button-group"] = function($data, $options) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $block, $model, $set, $buttonGroup, $item, $button;
    $C($ConkittyEnv.p)
        .act(function $C_button_group_7_5() { $block = ("i-button-group"); })
        .act(function $C_button_group_8_5() { $model = (new ns.buttongroup($data, $options)); })
        .act(function $C_button_group_9_5() { $set = ($model.get('buttons')); })
        .div()
            .act(function() { $buttonGroup = this; })
            .attr("class", function $C_button_group_11_17() { return $block; })
            .choose()
                .when(function $C_button_group_13_18() { return ($set.length > 0); })
                    .each(function $C_button_group_14_28() { return ($set.models); })
                        .act(function($C_) { $item = $C_; })
                        .act(function() {
                            $button = $C._tpl["i::button"].call(new $ConkittyEnvClass(this), $item);
                        })
                .end(2)
                .otherwise()
                    .attr("class", function() { return $ConkittyChange(this, ($block + "__empty")); })
        .end(3)
        .act(function() {
            new ns.views.buttongroup(
                {
                    'el': $buttonGroup,
                    'model': $model
                }
            );
        })
        .act(function() { $ConkittyTemplateRet = $model; })
    .end();
    return $ConkittyTemplateRet;
};

$C._tpl["i::input"] = function($data) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $block, $model, $wrapper, $input, $clear;
    $C($ConkittyEnv.p)
        .act(function $C_input_8_5() { $block = ("i-input"); })
        .act(function $C_input_9_5() { $model = (ns.input($data)); })
        .div()
            .act(function() { $wrapper = this; })
            .attr("class", function $C_input_11_17() { return $block; })
            .attr("class", function() { return $ConkittyChange(this, ($block + "__size-" + $model.get("size"))); })
            .test(function $C_input_13_14() { return (!$model.get('value')); })
                .attr("class", function() { return $ConkittyChange(this, ($block + '__empty')); })
            .end()
            .test(function $C_input_15_14() { return ($model.get('disabled')); })
                .attr("class", function() { return $ConkittyChange(this, ($block + '__disabled')); })
            .end()
            .elem("input")
                .act(function() { $input = this; })
                .attr("class", function $C_input_18_20() { return ($block + '__input'); })
                .attr("placeholder", function $C_input_19_26() { return ($model.get('placeholder')); })
                .attr("value", function $C_input_20_20() { return ($model.get('value')); })
                .test(function $C_input_21_18() { return ($model.get('disabled')); })
                    .attr("disabled", "disabled")
            .end(2)
            .div()
                .act(function() { $clear = this; })
                .attr("class", function $C_input_24_20() { return ($block + '__clear'); })
        .end(2)
        .act(function() {
            new ns.views.input(
                {
                    'el': $wrapper,
                    'model': $model
                }
            );

        })
        .act(function() { $ConkittyTemplateRet = $model; })
    .end();
    return $ConkittyTemplateRet;
};

$C._tpl["i::suggest"] = function($data, $options) {
    var $ConkittyEnv = $ConkittyGetEnv(this), $ConkittyTemplateRet, $block, $model, $suggest, $select;
    $C($ConkittyEnv.p)
        .act(function $C_suggest_8_5() { $block = ("i-suggest"); })
        .act(function $C_suggest_9_5() { $model = (ns.suggest($data, $options)); })
        .div({"class": "i-suggest"})
            .act(function() { $suggest = this; })
            .test(function $C_suggest_11_14() { return ($model.get('param')); })
                .attr("class", function() { return $ConkittyChange(this, "i-suggest__param"); })
            .end()
            .act(function() {
                $select = $C.tpl["i-suggest-select"].call(new $ConkittyEnvClass(this), ($model));
            })
            .act(function() {
                $model.set('select', $select);
                new ns.views.suggest(
                    {
                        'el': $suggest,
                        'model': $model
                    }
                );

            })
        .end()
        .act(function() { $ConkittyTemplateRet = $model; })
    .end();
    return $ConkittyTemplateRet;
};

}).apply(null, $C._$args);})(qex_controls);

(function (ns, window, Backbone, $){
/* namespace structure */
ns.models = {};
ns.views  = {};
ns.sets   = {};
ns.keys = {
    up:38, down:40, left:37, right:39,
    backspace:8, space:32, tab:9,
    enter:13, esc:27
}
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.button = function(data){
    var button;
    
    if (typeof data === 'string'){
        button = new ns.models.button({'label':data})
    } else

    if (data instanceof Backbone.Model){
        button = data;
    } else

    if (Object.prototype.toString.call(data) === '[object Object]'){
        button = new ns.models.button(data);
    }

    return button;
}})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.models.button = Backbone.Model.extend(
    {
        'defaults': {
            'size':     'M',
            'checked':  false,
            'disabled': false,
            'loading':  false,
            'template': void(0),
            'init': false
        },
        'isDisabled': function(){
            return this.get('disabled') || this.get('loading');
        }
    }
);
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
var changed = {},
    events = {
            'keydown': 'keyPressed',
            'keyup': 'keyAction',
            'mousedown': 'pressed',
            'mouseup': 'action',
            'mouseout': 'mouseout',
            'mouseover': 'mouseover',
            'click': 'stop',
            'focus': 'onfocus',
            'blur':  'onblur'
     };
ns.views.button = Backbone.View.extend(
    {
        'block': 'i-button',

        'events': {
            'mouseover': 'asyncInit',
            'focus': 'onfocus',
            'blur':  'onblur'
        },

        'actions': {
            'init':     ['setClass'],
            'action':   ['setClass'],
            'checked':  ['setClass'],
            'disabled': ['setClass', 'disable'],
            'loading':  ['setClass', 'disable'],
            'label':    ['renderFace'],
            'pseudofocus': ['setClass']
        },

        'initialize': function(options) {
            for(var k in this.actions){
                this.setActions(k);
            }
            this.listenTo(
                this.model,
                'destroy',
                this.remove
            );
            this.listenTo(
                this.model,
                'asyncInit',
                this.asyncInit
            );
            this.listenTo(
                this.model,
                'change',
                this.onChange
            );
            this.listenTo(
                this.model,
                'update',
                this.renderFace
            );
        },

        'asyncInit': function() {
            if( !this.model.get('init') ){
                this.delegateEvents(events);
                this.model.set('init', true);
            }
        },

        'onfocus': function(){
            this.$el.addClass('i-button__pseudofocus');
            this.asyncInit();
        },
        'onblur': function(){
            this.$el.removeClass('i-button__pseudofocus');
        },

        'setActions': function(modifier) {
            var actions = this.actions[modifier],
                invokeAction = function(model, value) {
                    /* closure: modifier, actions */
                    for (var i = 0, l = actions.length; i < l; i++) {
                        this[actions[i]](modifier, value);
                    }
                };
            if (modifier in changed) {
                invokeAction.call(this, this.model, this.model.get(modifier));
            }
            this.listenTo(
                this.model,
                'change:' + modifier,
                invokeAction
            );
        },

        'stop': function(e) {
            if (this.shouldIgnore(e)) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
        },

        'shouldIgnore': function(e) {
            return e && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey || e.button === 2);
        },

        'pressed': function(e) {
            if (this.shouldIgnore(e)) {
                return;
            }
            e && this.stop(e);
            if (!this.model.isDisabled()) {
                this.setClass('pressed', true);
            }
        },

        'keyPressed': function(e) {
            switch (e.which) {
                case ns.keys.enter:
                    this.enterPressed || this.pressed(e);
                    this.enterPressed = true;
                    break;
                case ns.keys.space:
                    this.spacePressed || this.pressed(e);
                    this.spacePressed = true;
                    break;
            }
        },

        'action': function(e) {
            var proxied = e.clientX > 0;
            this.setClass('pressed', false);
            if (this.shouldIgnore(e)) {
                return;
            }
            e && this.stop(e);
            if (!this.model.isDisabled()) {
                this.model.trigger(
                    'action',
                    this.model,
                    proxied
                );
            }
        },

        'keyAction': function(e) {
            switch (e.which) {
                case ns.keys.enter:
                    this.action(e);
                    this.enterPressed = false;
                    break;
                case ns.keys.space:
                    this.action(e);
                    this.spacePressed = false;
                    break;
            }
        },

        'mouseout': function(e) {
            this.setClass('hover', false);// async delay
            !this.enterPressed && !this.spacePressed && this.setClass('pressed', false);
        },

        'mouseover': function(e) {
            this.setClass('hover', true);// async delay
            !this.enterPressed && !this.spacePressed;
        },

        'setClass': function(modifier, value) {
            this.$el.toggleClass(this.block + '__' + modifier, !!value);
        },
        'disable': function(modifier, value) {
            if(this.model.isDisabled()){
                this.$el.attr('disabled', true);
                this.$el.attr('tabindex', '-1');
            } else {
                this.$el.removeAttr('disabled');
                this.$el.attr('tabindex', '0');
            }
        },
        'onChange': function() {
            Object.keys(
                this.model.changedAttributes()
            ).every(
                {}.hasOwnProperty.bind(
                    this.actions
                )
            ) || this.renderFace();
        },
        'renderFace': function() {
            var face = this.$('.i-button__face'),
                template = this.model.get('template') || 'i-button__label';
                face.empty();

            $C.tpl[template].call(
                face[0],
                this.model
            );
        }
    }
);
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.models.popup = Backbone.Model.extend(
    {   
        'initialize': function() {
            this.get('adaptive') === true &&
                this.set(
                    'adaptive',
                    'bottom left top right'
                );
            this.on(
                'change:side',
                this.getDimensions
            );
        },
        'getDimensions': function() {
            var side = this.get('side'),
                hor = side === 'left' || side === 'right',
                opposites = {
                    'top': 'bottom',
                    'bottom': 'top',
                    'left': 'right',
                    'right': 'left'
                };
            this.set({
                'sideDim'   : hor ? 'width'  : 'height',
                'alignDim'  : hor ? 'height' : 'width',
                'sideStart' : hor ? 'left'   : 'top',
                'alignStart': hor ? 'top'    : 'left',
                'opposite': opposites[side]
            });
            this.set(
                'sideEnd',
                opposites[this.get('sideStart')]
            );
            this.set(
                'alignEnd',
                opposites[this.get('alignStart')]
            );
        },
        'defaults': {
            'owner': document.body,
            'side': 'bottom',
            'adaptive': false,
            'align': 'start',
            'sideOffset': '.5em',
            'alignOffset': '1px',
            'tail': false,
            'tailWidth': '1em',
            'tailHeight': '.5em',
            'tailAlign': 'center',
            'tailOffset': '0px',
            'autoclose': true,
            'delay': 500
        }
    }
);})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
var offsetDim = {
    'height': 'offsetHeight',
    'width': 'offsetWidth'
};

//create a custom 'remove' event which is fired at all the elements removed by jQuery/Zepto
$.cleanData              ? 
    // jQuery
    $.cleanData = (function (origFn) {
        return function(elems) {
            $(elems).each(function(){
                $(this).triggerHandler('remove');    
            });
            return origFn.apply(this, arguments);     
        };
    })($.cleanData)      :
    // Zepto
    ['empty', 'remove'].forEach(
        function(method) {
            $.fn[method] = (function (origFn) {
                return function() {
                    var elems = this.find('*');
                    method === 'remove' && (elems = elems.add(this));
                    elems.triggerHandler('remove');
                    return origFn.apply(this, arguments);     
                };
            })($.fn[method])
        }
    );

/*convert any valid css length value except percents
(https://developer.mozilla.org/en-US/docs/Web/CSS/length) to px*/
$.fn.toPx = function(value, type) {
    var dim = type || 'height',
        $test = $('<div>')
            .css({
                'visibility': 'hidden',
                'position': 'absolute'
            })
            [dim](value)
            .appendTo(this),
        result = $test[dim]();
    $test.remove();
    return result;
}


ns.views.popup = Backbone.View.extend({
    'initialize': function() {
        var mode = this.model.get('mode');
        this.$owner = $(this.model.get('owner'));
        this.show = this.show.bind(this);
        this.setShowTimeout = this.setShowTimeout.bind(this);
        this.clearShowTimeout = this.clearShowTimeout.bind(this);
        mode === 'click' && this.listenToOwner(mode);
        mode === 'hover' && this.showOnHover();
    },
    'styleTail': function() {
        var params = this.model.attributes,
            popupAlignDim = this.el[offsetDim[params.alignDim]],
            halfWidth = Math.min(
                this.$owner.toPx(params.tailWidth),
                popupAlignDim
            )/2,
            height = this.$owner.toPx(params.tailHeight),
            hypotenuse = Math.sqrt(halfWidth * halfWidth + height * height),
            initial = 2 * Math.ceil(halfWidth * height / hypotenuse),
            kh = Math.SQRT2 * height / initial,
            kw = Math.SQRT2 * halfWidth / initial,
            alignOffset = this.$owner.toPx(params.alignOffset),
            tailOffset = this.$owner.toPx(params.tailOffset),
            ownerAlignDim = this.$owner[0][offsetDim[params.alignDim]],
            popupOffsets = {
                'start': alignOffset,
                'center': ownerAlignDim/2 
                    - popupAlignDim/2 + alignOffset,
                'end': ownerAlignDim
                    - popupAlignDim - alignOffset
            },
            tailOffsets = {
                'start': tailOffset,
                'center': ownerAlignDim/2 + tailOffset,
                'end': ownerAlignDim - tailOffset
            },
            tailPosition = tailOffsets[params.tailAlign] -
                popupOffsets[params.align],
            angles = {
               'top': -135,
               'right': -45,
               'bottom': 45,
               'left': 135    
            },
            tailStyle = {
                'height': initial,
                'width': initial,
                'transform': 'scale(' + kw + ', ' + kh +
                    ') rotate(' + angles[params.side] + 'deg)'
            };
        tailPosition < halfWidth && (tailPosition = halfWidth);
        tailPosition > popupAlignDim - halfWidth &&
            (tailPosition > popupAlignDim - halfWidth);
        tailStyle[params.opposite] = -initial/2;
        tailStyle[params.alignStart] = tailPosition - initial/2;
        tailStyle[params.alignEnd] = 'auto',
        tailStyle[params.side] = 'auto',
        this.$('.i-popup__tail').css(tailStyle);
    },
    'position': function() {
        this.model.get('adaptive') && this.chooseSide();
        this.setLocation();
    },

    'chooseSide': function() {
        var params = this.model.attributes,
            rect = params.owner.getBoundingClientRect(),
            popupHeight = this.el.offsetHeight,
            popupWidth = this.el.offsetWidth,
            sideOffset = this.$owner.toPx(params.sideOffset) +
                (params.tail && this.$owner.toPx(params.tailHeight)),
            offsets = {
                'top': rect.top - popupHeight - sideOffset,
                'right': window.innerWidth - rect.right
                    - popupWidth - sideOffset,
                'bottom': window.innerHeight - rect.bottom
                    - popupHeight - sideOffset,
                'left': rect.left - popupWidth - sideOffset
            },
            sides = this.model.get('adaptive').split(' '),
            maxOffset = -Infinity,
            i = 0,
            l = sides.length,
            offset,
            side;
        for (; i < l; i++) {
            offset = offsets[sides[i]];
            if (offset >= 0 ) {
                this.model.set('side', sides[i]);
                return;
            }
            if (offset > maxOffset) {
                maxOffset = offset;
                side = sides[i];
            }
        }
        this.model.set('side', side);
    },
    'setLocation': function() {
        var params = this.model.attributes,
            ownerRect = params.owner.getBoundingClientRect(),
            parentRect = this.$el.parent()[0].getBoundingClientRect(),
            baseSideOffset = ownerRect[params.side]
                - parentRect[params.sideStart],
            baseAlignStartOffset = ownerRect[params.alignStart]
                - parentRect[params.alignStart],
            baseAlignEndOffset = ownerRect[params.alignEnd]
                - parentRect[params.alignStart],
            baseAlignCenterOffset =
                (baseAlignStartOffset + baseAlignEndOffset) / 2,
            sideOffset = this.$owner.toPx(params.sideOffset) +
                (params.tail && this.$owner.toPx(params.tailHeight)),
            alignOffset = this.$owner.toPx(params.alignOffset),
            popupAlignDim = this.el[offsetDim[params.alignDim]],
            popupSideDim = this.el[offsetDim[params.sideDim]],
            alignStyles = {
                'start': baseAlignStartOffset + alignOffset,
                'center': baseAlignCenterOffset + alignOffset - popupAlignDim/2,
                'end': baseAlignEndOffset - alignOffset - popupAlignDim
            },
            styles = {};
        styles[params.alignStart] = alignStyles[params.align];
        styles[params.sideStart] = 
            params.side === params.sideStart ?
                // top or left 
                baseSideOffset - popupSideDim - sideOffset :
                // bottom or right
                baseSideOffset + sideOffset;
        this.$el.css(styles);
        params.tail && this.styleTail();
    },
    'show': function(e) {
        this.isAppended || this.append();
        e && e.preventDefault();
        this.$el.show();
        this.position();
        $(window).on('scroll resize', this.position);
        this.trigger('show');
    },
    'hide': function() {
        $(window).off('scroll resize', this.position);
        this.$el.hide();
        this.trigger('hide');
        
    },
    'append': function() {
        var container = this.$owner.closest('.i-popup')[0] || document.body;
        this.model.getDimensions();
        this.position = this.position.bind(this);
        this.hide = this.hide.bind(this);
        this.setHideTimeout = this.setHideTimeout.bind(this);
        this.clearHideTimeout = this.clearHideTimeout.bind(this);
        this.autoclose = this.autoclose.bind(this);
        this.autodestroy = this.autodestroy.bind(this);
        
        this.model.get('autoclose') && this.once('show', this.addAutoclose);
        container.appendChild(this.el);
        this.isAppended = true;
        this.$owner.one('remove', this.autodestroy);
        this.$el.css('font-size', this.$owner.toPx('1em'));
    },
    'autodestroy': function() {
        this.hide();
        this.remove();
    },
    'addAutoclose': function() {
        window.setTimeout(
            document.addEventListener.bind(
                document,
                'click',
                this.autoclose,
                true // use capture
            ),
            0
        );
        this.once('hide', this.removeAutoclose);
    },
    'removeAutoclose': function() {
        document.removeEventListener(
            'click',
            this.autoclose,
            true // use capture
        );
        this.once('show', this.addAutoclose);
    },
    'autoclose': function(e) {
        this.el.contains(e.target) || this.hide();
    },
    'listenToOwner': function(mode) {
        window.setTimeout(
            $.fn.one.bind(
                this.$owner,
                mode,
                this.show
            ),
            0
        );
        this.once('hide', this.listenToOwner.bind(this, mode));
    },

    'showOnHover': function() {
        this.$owner.off('mouseleave', this.setHideTimeout);
        this.$el.off('mouseleave', this.setHideTimeout);
        this.$owner.off('mouseenter', this.clearHideTimeout);
        this.$el.off('mouseenter', this.clearHideTimeout);

        this.$owner.on('mouseenter', this.setShowTimeout);
        this.$owner.on('mouseleave', this.clearShowTimeout);

        this.once('show', this.hideOnUnhover);
    },
    'hideOnUnhover': function() {
        this.$owner.off('mouseenter', this.setShowTimeout);
        this.$owner.off('mouseleave', this.clearShowTimeout);

        this.$owner.on('mouseleave', this.setHideTimeout);
        this.$el.on('mouseleave', this.setHideTimeout);
        this.$owner.on('mouseenter', this.clearHideTimeout);
        this.$el.on('mouseenter', this.clearHideTimeout);

        this.once('hide', this.showOnHover);
    },
    'setHideTimeout': function() {
        this.hideTimeout = window.setTimeout(
            this.hide,
            this.model.get('hideDelay') || this.model.get('delay')
        );
    },
    'clearHideTimeout': function() {
        window.clearTimeout(this.hideTimeout);
    },
    'setShowTimeout': function() {
        this.showTimeout = window.setTimeout(
            this.show,
            this.model.get('showDelay') || this.model.get('delay')
        );
    },
    'clearShowTimeout': function() {
        window.clearTimeout(this.showTimeout);
    }
});})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.select = function(data, _options){
    var options = _options || {},
        optionsCollection = function(data){

            if (typeof data === 'string'){
                var delim = options.delim || ',';
                return [
                    optionsCollection(data.split(delim))[0],
                    "string"
                ];
            } else

            if (data instanceof Backbone.Collection){
                return [
                    data,
                    "collection"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Array]'){
                return  [
                            new Backbone.Collection(
                                data.map(
                                    function(option){
                                        return new Backbone.Model(
                                            {label: option}
                                        )
                                    }
                                )
                            ),
                            "array"
                        ]
            } else

            if (Object.prototype.toString.call(data) === '[object Object]'){
                options = data;
                data = options.options;
                delete options.options;
                return optionsCollection(data, options);
            } else

            {
                throw new TypeError("TypeError");
            }
        },
        result = optionsCollection(data);
        options.options = result[0];
        options.type    = result[1];

    return new ns.models.select( options );
}
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.models.select = Backbone.Model.extend(
    {
        'defaults': {
            'open':        false,
            'size':        'M',
            'placeholder': 'none',
            'mode':        'radio',
            'delim':       ',',
            'index':       {},
            'filtered':    {},
            'disabled':    false,
            'focus':       void(0),
            'label':       void(0),
            'selected':    void(0),
            'type':        void(0),
            'viewButton':  void(0),
            'viewOption':  void(0)
        },

        'initialize': function ns_models_select(attrs) {
            if (!attrs || !('options' in attrs)){
                throw "i::select: incorrect options";
            }
            attrs.options.length || this.set('disabled', true);
            this.on('change:selected', this.selectedHandler);
            this.on('change:open',     this.openHandler);
            this.reset();
        },

        'reset': function(){
            this.set('index',    this.getIndex(true));
            this.set('selected', this.getSelected());
        },

        'openHandler': function(select, value){
            this.set('focus', void(0));
        },

        'selectedHandler': function(select, value){
            var type = this.get('type'),
                isCheck = this.isCheck(),
                placeholder = this.get('placeholder'),
                label = placeholder;

            if(value){
                if(value.length!==0){
                    if(type==='string' || type==='array'){
                        label = value;
                    } else if(type==='collection'){
                        if(isCheck){
                            label = value
                                    .map(this.getOptionLabel.bind(this))
                                    .join(this.get("delim"));
                        } else {
                            label = value.has('label') ? value.get('label') : value.cid;
                        }
                    }
                }
            }
            if(isCheck){
                this.set('checked', (label !== placeholder));
            }
            this.set('label', label);
        },

        'toggleOpen': function(open){
            this.set(
                'open',
                open===(void 0) ? !this.get('open') : !!open
            );
        },

        'selectFocused': function(){
            if(this.get("focus")){
                this.selectByCid(
                    this.get("focus")
                );
            }
            if (!this.isCheck()) {
                this.toggleOpen(false);
            }
        },

        'select': function(value){
            if (!value){
                throw "i::select: incorrect value";
            }
            var select = this,
                type = this.get('type'),
                options = this.get('options'),
                isCheck = this.isCheck(),
                cid,
                selected;

            if(typeof value === 'string'){
                selected = options.where({label: value});
            } else if(value instanceof Backbone.Model){
                select.selectByCid(value.cid);
                return this;
            } else {
                throw "i::select: incorrect value type";
            }

            if(selected.length){
                selected.forEach(
                    function(option){
                        select.selectByCid(option.cid);
                    }
                )
            } else {
                this.reset();
            }
            return this;
        },

        'getIndex': function(reset){
            var old   = this.get('index'),
                index = {};
            if(!reset){
                this.get('options').forEach(
                    function(option){
                        index[option.cid] = option.cid in old ? old[option.cid] : false;
                    },
                    this
                );
            }
            return index;
        },

        'getSelected': function(_type){
            var type     = _type || this.get("type"),
                index    = this.get("index"),
                options  = this.get("options"),
                isCheck  = this.isCheck(),
                selected = [],
                option,
                id;

            for(id in index){
                if(index[id]){
                    option = options.get({cid: id});
                    selected.push(option);
                }
            }

            if (type === 'string') {
                selected = selected.join(this.get("delim"));
            } else {
                if(!isCheck){
                    selected = selected.length ? selected[0] : null;
                }
            }

            return selected;
        },

        'getOptionLabel': function(option){
            var label;
            if (option.has('label')){
                label = option.get('label');
            } else if (option.has('value')){
                label = option.get('value');
            } else {
                label = option.cid;
            }
            return label;
        },

        'selectByCid': function(cid){
            if (typeof cid !== 'string'){
                throw "i::select: incorrect cid";
            }
            var index = this.get('index'),
                isCheck = this.isCheck(),
                id;

            if (!isCheck) {
                for(id in index){
                    index[id] = id===cid ? index[id] : false;
                }
            }
            index[cid] = isCheck ? !index[cid] : true;
            this.setSelected();
        },

        'setSelected': function(){
            var index   = this.get('index'),
                type    = this.get('type'),
                isCheck = this.isCheck(),
                result  = this.get('options')
                            .filter(
                                function(option){
                                    return !!index[option.cid];
                                }
                            )
                            .map(
                                this.getOptionValue.bind(this)
                            );
            if(type==='string'){
                result = result.join(
                    this.get('delim')
                );
            } else {
                if(!isCheck){
                    result = result[0];
                }
            }
            this.set("selected", result);
        },

        'getOptionValue': function(option){
            var type = this.get('type');
            if(type==='string' || type==='array'){
                if(option.has('label')){
                    return option.get('label');
                } else if(option.has('value')){
                    return option.get('value');
                } else {
                    return option.toJSON();
                }
            } else {
                return option;
            }
        },

        'isCheckedOption': function(option){
            var index = this.get('index'),
                key = option.cid;
            return key in index ? index[key]===true : false;
        },

        'isCheck': function() {
            return this.get('mode') === 'check';
        },
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
        'focusPrev': function() {
            var current  = this.get('focus'),
                options  = this.get('options'),
                filtered = this.get('filtered'),
                prev     = false;
            if(current){
                options.every(
                    function(option){
                        if(option.cid in filtered){
                            return true;
                        }

                        if(option.cid === current){
                            this.set('focus', prev);
                            return false;
                        } else {
                            prev = option.cid;
                        }

                        return true;
                    },
                    this
                );
            }
            return prev;
        },
        'focusNext': function() {
            var current  = this.get('focus'),
                options  = this.get('options'),
                filtered = this.get('filtered'),
                next     = false;
            if(current){
                options.every(
                    function(option){
                        if(option.cid in filtered){
                            return true;
                        }

                        if(next){
                            this.set('focus', option.cid);
                            return false;
                        } else if(option.cid === current){
                            next = true;
                        }
                        return true;
                    },
                    this
                );
            } else {
                options.every(
                    function(option){
                        if(option.cid in filtered){
                            return true;
                        } else {
                            next = option.cid;
                            return false;
                        }
                    },
                    this
                );
                this.set('focus', next);
            }
            return true;
        }
    }
);
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
'use strict';

var block = 'i-select';

ns.views.select = Backbone.View.extend({
    'events': {
        'keydown .i-button': 'onkeydown',
        'keyup   .i-button': 'onkeyup',
        'blur    .i-button': 'onblur',
        'mousedown': 'stop',
        'mouseup':   'proxyButton',
        'mouseout':  'proxyButton',
        'mouseover': 'proxyButton',
        'click':     'proxyButton'
    },

    'initialize': function(options) {

        this.$button = options.$button;
        this.$popup  = options.$popup;
        this.$list   = options.$list;

        this.listenTo(
            this.$button,
            'action',
            this.buttonHandler
        );
        this.listenTo(
            this.$popup,
            'show',
            this.popupHandler.bind(this, true)
        );
        this.listenTo(
            this.$popup,
            'hide',
            this.popupHandler.bind(this, false)
        );
        this.listenTo(
            this.model,
            'change:label',
            this.proxyLabel
        );
        this.listenTo(
            this.model,
            'asyncInit',
            this.proxyInit
        );
        this.listenTo(
            this.model,
            'change:open',
            this.openHandler
        );
        this.listenTo(
            this.model,
            'change:checked',
            this.proxyChecked
        );
        this.listenTo(
            this.model,
            'change:disabled',
            this.proxyDisabled
        );
    },
    'onblur': function(){
        //this.model.set('open', false);
    },
    'onkeyup': function(e) {
        switch (e.which) {
            case ns.keys.esc:
                e.preventDefault();
                this.model.set('open', false);
            break;
        }
    },
    'stop': function(e){
        e.preventDefault();
        e.stopPropagation();
    },
    'onkeydown': function(e) {
        var select = this.model;
        switch (e.which) {
            case ns.keys.up:
                e.preventDefault();
                (select.focusPrev() && this.scrollFocused(select.get('focus'), true)) || select.set('open', false);
            break;
            case ns.keys.down:
                e.preventDefault();
                select.get('open') ? (select.focusNext() && this.scrollFocused(select.get('focus'), false)) : select.set('open', true);
            break;
        }
    },
    'scrollFocused': function(cid, dir){
        if(cid){
            this.$list.focusScroll(cid, dir);
        }
        return true;
    },
    'popupHandler': function(open){
        this.$el.toggleClass( block + '__open', open);
        this.model.set('open', open);
    },
    'openHandler': function(model, open) {
        if(open){
            this.$el.find('.i-button').not('[tabindex="-1"]').focus();
        }
        this.$popup[open ? 'show' : 'hide']();
    },
    'buttonHandler': function(button, real) {
        if (this.model.get("focus")) {
            if( real ){
                this.model.set("focus", void(0));
                this.model.toggleOpen(false);
            } else {
                this.model.selectFocused();
            }
        } else {
            this.model.toggleOpen();
        }
    },
    'proxyInit': function(){
        this.$button.trigger('asyncInit')
    },
    'proxyButton': function(e) {
        //console.log('proxyButton', e.clientX);
        if(e.clientX){
            this.model.set('focus', void(0));
            this.$el.find('.i-button').trigger(e.type);
        }
    },
    'proxyChecked': function(model, checked) {
        this.$button.set('checked', checked);
    },
    'proxyLabel': function(model, label) {
        this.$button.set('label', label);
    },
    'proxyDisabled': function(model, value) {
        this.$button.set('disabled', value);
    }
});})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
'use strict';

var block = 'i-select' + '__' + 'options-list' + '__' + 'item';

ns.views.selectOptions = Backbone.View.extend({
    'events': (function(){
                    var events = {};
                        events[ 'mousedown'                 ] = 'stop',
                        events[ 'mouseleave'                ] = 'optionFocus',
                        events[ 'mousemove .'+block         ] = 'optionFocus',
                        events[ 'mouseup   .'+block+'-focus'] = 'optionSelectPointer'
                    return events;
                })(),
    'initialize': function(options) {
        this.listenTo(
            this.model,
            'change:open',
            this.openHandler
        );
        this.listenTo(
            this.model,
            'change:focus',
            this.focusHandler
        );
        this.listenTo(
            this.model,
            'change:selected',
            this.setSelected
        );
        this.listenTo(
            this.model,
            'change:filtered',
            this.render
        );
        this.listenTo(
            this.model.get('options'),
            'reset sync',
            this.render
        );

    },
    'itemByCid': function(cid){
        return this.$el.find('.' + block + '[data-cid="'+cid+'"]');
    },
    'focusScroll': function(cid, dir){
        this.ignoreMouseFocus = true;
        this.itemByCid(cid).get(0).scrollIntoView(dir);
        setTimeout(
            function(list){
                delete list.ignoreMouseFocus;
            },
            100,
            this
        )
    },
    'focusHandler': function(model, cid){
        var prev   = model.previous("focus"),
            fclass = block + '-focus';

        if(prev){
            this.itemByCid(prev).removeClass(fclass)
        }

        if(cid){
            this.itemByCid(cid).addClass(fclass);
        }
    },
    'openHandler': function(model, open){
        if(open){
            this.render();
        } else {
            this.model.set('rendered', false);
        }
    },
    'render': function(){
        this.$el.html('');
        var top     = $C(this.el),
            select  = this.model,
            options = select.get('options'),
            index   = select.get('index'),
            filtered= select.get('filtered'),
            rendered= [];

        // concat.js
        options.forEach(
            function($option){

                if($option.cid in filtered){
                    return;
                }

                rendered.push($option.cid);

                var li = top.li({
                        'class':    block + ( !!index[$option.cid] ? ' '+block+'-selected' : '' ),
                        'data-cid': $option.cid
                    });

                select.get("viewOption")
                     ?
                        li.act(
                            function() {
                                $C.tpl[ select.get("viewOption") ].call(this, $option);
                            }
                        ).end()
                     :
                        li.text(
                            select.getOptionLabel($option)
                        ).end();
            }
        );
        select.set('rendered', rendered);
        this.model.set(
            'disabled',
            !options.length
        );
        top.end();
    },
    'stop': function(e){
        e.preventDefault();
        e.stopPropagation();
    },
    'optionSelectPointer': function(e){
        this.stop(e);
        this.model.selectFocused();
    },
    'optionFocus': function(e){
        if(!this.ignoreMouseFocus){
            this.model.set(
                'focus',
                e.currentTarget.getAttribute('data-cid')
            );
        }
    },
    'setSelected': function() {
        var index = this.model.get('index'),
            options = this.model.get('options'),
            cid;
        options.forEach(
            function(option){
                var cid = option.cid;
                this
                    .$('.' + block + '[data-cid="' + cid + '"]')
                    .toggleClass(block + '-selected', !!index[cid])
            },
            this
        );
    }
});})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.buttongroup = function(data, _options){
    var options = _options || {},

        _default = (ns.button('_default')).attributes,

        button = function (buttonOptions) {
            var result = {}, str = false;
            if(typeof buttonOptions === 'string'){
                result = {label: buttonOptions};
                str = true;
            } else if (buttonOptions instanceof Backbone.Model){
                result = buttonOptions.attributes;
            } else if (Object.prototype.toString.call(buttonOptions) === '[object Object]'){
                result = buttonOptions;
            } else {
                throw new TypeError("unknown button type");
            }
            for(var p in _default){
                if(p !== 'label'){
                    result[p] = !str && (p in buttonOptions)
                        ? buttonOptions[p]
                        :   (p in options
                                ? options[p]
                                : _default[p]
                            );
                }
            }
            return ns.button(result);
        },

        optionsCollection = function(data){

            if (typeof data === 'string'){
                var delim = options.delim || ',';
                return [
                    optionsCollection(data.split(delim))[0],
                    "string"
                ];
            } else

            if (data instanceof Backbone.Collection){
                return [
                    new Backbone.Collection(data.map(button)),
                    "collection"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Array]'){
                return  [
                    new Backbone.Collection(data.map(button)),
                    "array"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Object]'){
                options = data;
                data = options.buttons;
                delete options.buttons;
                return optionsCollection(data, options);
            } else

            {
                throw new TypeError("TypeError");
            }
        },

        result = optionsCollection(data);

    options.buttons = result[0];
    options.type    = result[1];

    return new ns.models.buttongroup( options );
}
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.views.buttongroup = Backbone.View.extend(
    {
        'block': 'i-button-group',
        'initialize': function(){

            this.checkSelected(
                this.model,
                this.model.get('selected')
            );

            this.listenTo(
                this.model.get('buttons'),
                'action',
                this.select
            );

            this.listenTo(
                this.model,
                'change:selected',
                this.checkSelected
            );

        },
        'select': function(button) {
            // select none if we're unchecking in radiocheck mode
            this.model.get('radiocheck') && button.get('checked') && (button = null);
            this.model.set('selected', button);
        },
        'checkSelected': function(model, selected) {
            var buttons = this.model.get('buttons'),
                button = buttons.get(selected);
            buttons.forEach(this.uncheck);
            button && button.set('checked', true);
        },
        'uncheck': function(button){
            button.set('checked', false)
        }
    }
);

ns.models.buttongroup = Backbone.Model.extend(
    {
        'defaults': {
            'buttons': [],
            'radiocheck': false,
            'selected': null
        }
    }
);
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.input = function(_data){
    var data = _data || '',
        input;
    
    if (typeof data === 'string'){
        input = new ns.models.input({'placeholder':data});
    } else

    if (data instanceof Backbone.Model){
        input = data;
    } else

    if (Object.prototype.toString.call(data) === '[object Object]'){
        input = new ns.models.input(data);
    }

    return input;
}})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){

ns.models.input = Backbone.Model.extend(
    {
        'defaults': {
            'placeholder': '',
            'size': 'M',
            'value': '',
            'disabled': false,
            'debounce': 0
        }
    }
);})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.views.input = Backbone.View.extend(
    {
        'actions': {
            'disabled':     'disable',
            'value':        'setValue',
            'placeholder':  'setPlaceholder'
        },
        'events': {
            'input': 'onInput',
            'click .i-input__clear': 'clear'
        },
        'initialize': function() {
            this.$input = this.$('.i-input__input');
            Object.keys(this.actions).forEach(
                this.listenToMods,
                this
            );
            this.listenTo(
                this.model,
                'focus',
                this.focus
            );
        },
        'focus': function(){
            this.$input.focus();
            if('setSelectionRange' in this.$input[0]){
                var length = this.$input.val().length;
                this.$input[0].setSelectionRange(length, length);
            }
        },
        'listenToMods': function(mod){
            this.listenTo(
                this.model,
                'change:' + mod,
                this[this.actions[mod]]
            );
        },
        'disable': function(model, value) {
            if (value !== false) {
                this.$el.addClass('i-input__disabled');
                this.$input.attr('disabled', 'disabled');
            } else {
                this.$el.removeClass('i-input__disabled');
                this.$input.removeAttr('disabled');
            }
        },
        'setPlaceholder': function(model, value){
            if (value) {
                this.$input.get(0).setAttribute(
                    'placeholder',
                    value
                );
            } else {
                this.$input.get(0).removeAttribute(
                    'placeholder'
                );
            }

        },
        'setValue': function(model, value) {
            value = value + '';
            this.$input.val(value);
            this.$el.toggleClass('i-input__empty', !(value.length > 0));
        },
        'onInput': function() {
            if (this.input) {
                clearTimeout(this.input);
                delete this.input;
            }
            this.input = setTimeout(
                this.readInput,
                this.model.get('debounce'),
                this
            );
        },
        'readInput': function(input){
            input.model.set('value', input.$input.val());
        },
        'clear': function() {
            this.$input.val('');
            this.$input.focus();
            this.$input.trigger('input');
        }
    }
);
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){

ns.suggest = function(data, _options){

    var options = _options || {},

        item = function(item){
            return {'value':item};
        },

        reURL = /^((?:(?:http|https):\/)?\.?\/.*)$/ ,

        parseURL = function(string){
            return string.match(reURL);
        },

        optionsCollection = function(data){

            if (typeof data === 'string'){
                var url = parseURL(data);
                if(url){
                    var set     = new Backbone.Collection();
                        set.url = data;
                    return [set, "url"];
                } else {
                    var delim = options.delim || ',';
                    return [
                        optionsCollection(data.split(delim))[0],
                        "string"
                    ];
                }
            } else

            if (data instanceof Backbone.Collection){
                return [data, "collection"];
            } else

            if (Object.prototype.toString.call(data) === '[object Array]'){
                return  [
                    new Backbone.Collection(data.map(item)),
                    "array"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Object]'){
                options = data;
                data = options.data;
                delete options.data;
                return optionsCollection(data, options);
            } else

            {
                throw new TypeError("TypeError message");
            }
        },

        result = optionsCollection(data);

    options.data = result[0];
    options.type = result[1];

    return new ns.models.suggest( options );
}})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
'use strict';

ns.models.suggest = Backbone.Model.extend(
    {
        'defaults': {
            'select': false,
            'option': false,
            'param':  false,
            'loading':  false,
            'debounce': 150,
            'placeholder': '',
            'size': 'M',
            'min': 0,
            'viewButton': 'i-suggest-input',
            'viewOption': void(0),
            'selected':   void(0),
            'filter':     void(0)
        },

        'initialize': function(){
            if(this.get('type') === 'url'){
                this.initURL();
            }
            this.on(
                'change:select',
                this.setSelect
            );
        },

        'load': function(){
            var done = this.set.bind(this, 'loading', false),
                filter = this.setFiltered.bind(this);
            this.get('data').fetch({
                'reset':   true,
                'success': function(){
                    filter() && done();
                },
                'error':   done
            });
            this.set('loading', true);
        },

        'initURL': function(){
            this.setUrl();
            if(!this.get('param')){
                this.load();
            }
        },

        'setUrl': function(){
            var suggest = this,
                data    = suggest.get('data'),
                url     = data.url;

            if(url.indexOf('%%input%%') > -1){
                this.set('param', true);
                data.url = function(){
                    return url.replace(
                        /%%input%%/,
                        suggest.get('select').get('input').get('value')
                    );
                }
            }
        },

        'setSelect': function(){
            var option = this.get('option'),
                select = this.get('select');
            if(option){
                if(typeof option === 'string'){
                    select.getOptionLabel = function(optionModel){
                        return optionModel.get(option);
                    }
                } else if(typeof option === 'function'){
                    select.getOptionLabel = option;
                }
            }

            select.on(
                'change:selected',
                this.setSelected,
                this
            );

            select.on(
                'change:input',
                this.setInput,
                this
            );

            select.on(
                'change:rendered',
                this.onRender,
                this
            );

            this.setInput(
                select,
                select.get('input')
            );

            if(this.get('param')){
                select.set(
                    'disabled',
                    false
                );
                select.on(
                    "change:disabled",
                    function(){
                        select.set('disabled', false);
                    }
                );
            }
        },

        'onRender': function(){
            this.get('select').set('focus', void(0));
            if(this.get('input')){
                setTimeout(
                    function(select){
                        var rendered = select.get('rendered');
                        if(rendered && rendered.length){
                            select.set('focus', rendered[0] );
                        }
                    },
                    50,
                    this.get('select')
                );
            }
        },

        'setSelected': function(){
            var select = this.get('select');
            select.set('filtered',{});
            this.set('selected', select.get('selected'));
            setTimeout(
                function(){
                    var input = select.get('input');
                    if(input){
                        input.trigger('focus');
                    }
                },
                50
            );
        },

        'setInput': function(select, input){
            if(input){
                input.set('placeholder', this.get('placeholder'));
                input.set('debounce',    this.get('debounce'));
                this.listenTo(input, 'change:value', this.input);
            }
        },

        'filter': function(option, input){
            return this
                        .get('select')
                        .getOptionLabel(option)
                        .toLowerCase()
                        .indexOf(
                            input ? input.toLowerCase() : ''
                        ) == 0;
        },

        'setFiltered': function(){
            var select = this.get('select'),
                filter = this.get('filter') && (typeof this.get('filter') === 'function') ? this.get('filter') : this.filter,
                filtered = {};

            this.get('data').models.forEach(
                function (option) {

                    if ( ! filter.call(this, option, select.get('input').get('value') ) ) {
                        filtered[option.cid] = true;
                    }
                },
                this
            );
            select.set('filtered', filtered);
        },

        'setSuggest': function(open){
            this.setFiltered();
            this.get('select').set('open', open!==false);
        },


        'input': function (input, value) {

            this.set('input', 'value');

            var str    = value.toLowerCase().trim(),
                select = this.get('select');

            if(str && str.length >= this.get('min')){
                if( this.get('param') ){
                    this.get('data').once('sync', this.setSuggest, this);
                    this.load();
                } else {
                    this.setSuggest();
                }
            } else {
                if( this.get('param') ){
                    this.get('data').reset();
                }
                select.reset();
                this.setSuggest();
            }
        }
    }
);
})(qex_controls, window, Backbone, $);

(function (ns, window, Backbone, $){
ns.views.suggest = Backbone.View.extend(
    {
        'initialize': function (argument) {
            this.listenTo(
                this.model,
                'change:select',
                this.setSelect
            );
            this.listenTo(
                this.model,
                'change:loading',
                this.setLoading
            );
            this.setSelect();
        },
        'setLoading': function(){
            this.$el.toggleClass(
                'i-suggest__loading',
                this.model.get('loading')
            );
        },
        'setSelect': function(){
            var select = this.model.get('select');
            select.on(
                'change:input',
                this.setInput,
                this
            );
            this.setInput(
                select,
                select.get('input')
            );
        },
        'setInput': function(select, input){
            var $input  = this.$el.find('.i-input__input'),
                $button = this.$el.find('.i-button');

            if(input){
                if( $input.length === 0 ){
                    setTimeout(
                        function(self){
                            self.setInput(select, input)
                        },
                        0,
                        this
                    );
                } else {
                    $input.on({
                        'click':     this.stop,
                        'mousedown': this.stop,
                        'mouseup':   this.stop,
                        'focus':     this.focus.bind(this, true),
                        'blur':      this.focus.bind(this, false),
                        'keyup':     this.keyfilter,
                        'keydown':   this.keyfilter
                    });

                    $button.attr({'tabindex': -1});
                    $input .attr({'tabindex':  0});
                }
            } else {
                $button.attr({'tabindex': 0});
                $button.focus();
            }
        },

        'focus': function(focus, e){
            this.stop(e);
            this.$el
                .find('.i-button')
                .toggleClass('i-button__pseudofocus', focus);
            focus && this.model.get('select').trigger('asyncInit');
        },

        'stop': function(e){
            e.stopPropagation();
        },

        'keyfilter': function(e){
            switch (e.which) {
                case ns.keys.backspace:
                case ns.keys.space:
                    e.stopPropagation();
                break;
            }
        }
    }
);})(qex_controls, window, Backbone, $);


})();
