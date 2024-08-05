(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // <stdin>
  var require_stdin = __commonJS({
    "<stdin>"(exports, module) {
      var _self = "undefined" != typeof window ? window : "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope ? self : {};
      var Prism = function(e) {
        var n = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, t = 0, r = {}, a = { manual: e.Prism && e.Prism.manual, disableWorkerMessageHandler: e.Prism && e.Prism.disableWorkerMessageHandler, util: { encode: function e2(n2) {
          return n2 instanceof i ? new i(n2.type, e2(n2.content), n2.alias) : Array.isArray(n2) ? n2.map(e2) : n2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
        }, type: function(e2) {
          return Object.prototype.toString.call(e2).slice(8, -1);
        }, objId: function(e2) {
          return e2.__id || Object.defineProperty(e2, "__id", { value: ++t }), e2.__id;
        }, clone: function e2(n2, t2) {
          var r2, i2;
          switch (t2 = t2 || {}, a.util.type(n2)) {
            case "Object":
              if (i2 = a.util.objId(n2), t2[i2]) return t2[i2];
              for (var l2 in r2 = {}, t2[i2] = r2, n2) n2.hasOwnProperty(l2) && (r2[l2] = e2(n2[l2], t2));
              return r2;
            case "Array":
              return i2 = a.util.objId(n2), t2[i2] ? t2[i2] : (r2 = [], t2[i2] = r2, n2.forEach(function(n3, a2) {
                r2[a2] = e2(n3, t2);
              }), r2);
            default:
              return n2;
          }
        }, getLanguage: function(e2) {
          for (; e2; ) {
            var t2 = n.exec(e2.className);
            if (t2) return t2[1].toLowerCase();
            e2 = e2.parentElement;
          }
          return "none";
        }, setLanguage: function(e2, t2) {
          e2.className = e2.className.replace(RegExp(n, "gi"), ""), e2.classList.add("language-" + t2);
        }, currentScript: function() {
          if ("undefined" == typeof document) return null;
          if ("currentScript" in document) return document.currentScript;
          try {
            throw new Error();
          } catch (r2) {
            var e2 = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(r2.stack) || [])[1];
            if (e2) {
              var n2 = document.getElementsByTagName("script");
              for (var t2 in n2) if (n2[t2].src == e2) return n2[t2];
            }
            return null;
          }
        }, isActive: function(e2, n2, t2) {
          for (var r2 = "no-" + n2; e2; ) {
            var a2 = e2.classList;
            if (a2.contains(n2)) return true;
            if (a2.contains(r2)) return false;
            e2 = e2.parentElement;
          }
          return !!t2;
        } }, languages: { plain: r, plaintext: r, text: r, txt: r, extend: function(e2, n2) {
          var t2 = a.util.clone(a.languages[e2]);
          for (var r2 in n2) t2[r2] = n2[r2];
          return t2;
        }, insertBefore: function(e2, n2, t2, r2) {
          var i2 = (r2 = r2 || a.languages)[e2], l2 = {};
          for (var o2 in i2) if (i2.hasOwnProperty(o2)) {
            if (o2 == n2) for (var s2 in t2) t2.hasOwnProperty(s2) && (l2[s2] = t2[s2]);
            t2.hasOwnProperty(o2) || (l2[o2] = i2[o2]);
          }
          var u2 = r2[e2];
          return r2[e2] = l2, a.languages.DFS(a.languages, function(n3, t3) {
            t3 === u2 && n3 != e2 && (this[n3] = l2);
          }), l2;
        }, DFS: function e2(n2, t2, r2, i2) {
          i2 = i2 || {};
          var l2 = a.util.objId;
          for (var o2 in n2) if (n2.hasOwnProperty(o2)) {
            t2.call(n2, o2, n2[o2], r2 || o2);
            var s2 = n2[o2], u2 = a.util.type(s2);
            "Object" !== u2 || i2[l2(s2)] ? "Array" !== u2 || i2[l2(s2)] || (i2[l2(s2)] = true, e2(s2, t2, o2, i2)) : (i2[l2(s2)] = true, e2(s2, t2, null, i2));
          }
        } }, plugins: {}, highlightAll: function(e2, n2) {
          a.highlightAllUnder(document, e2, n2);
        }, highlightAllUnder: function(e2, n2, t2) {
          var r2 = { callback: t2, container: e2, selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code' };
          a.hooks.run("before-highlightall", r2), r2.elements = Array.prototype.slice.apply(r2.container.querySelectorAll(r2.selector)), a.hooks.run("before-all-elements-highlight", r2);
          for (var i2, l2 = 0; i2 = r2.elements[l2++]; ) a.highlightElement(i2, true === n2, r2.callback);
        }, highlightElement: function(n2, t2, r2) {
          var i2 = a.util.getLanguage(n2), l2 = a.languages[i2];
          a.util.setLanguage(n2, i2);
          var o2 = n2.parentElement;
          o2 && "pre" === o2.nodeName.toLowerCase() && a.util.setLanguage(o2, i2);
          var s2 = { element: n2, language: i2, grammar: l2, code: n2.textContent };
          function u2(e2) {
            s2.highlightedCode = e2, a.hooks.run("before-insert", s2), s2.element.innerHTML = s2.highlightedCode, a.hooks.run("after-highlight", s2), a.hooks.run("complete", s2), r2 && r2.call(s2.element);
          }
          if (a.hooks.run("before-sanity-check", s2), (o2 = s2.element.parentElement) && "pre" === o2.nodeName.toLowerCase() && !o2.hasAttribute("tabindex") && o2.setAttribute("tabindex", "0"), !s2.code) return a.hooks.run("complete", s2), void (r2 && r2.call(s2.element));
          if (a.hooks.run("before-highlight", s2), s2.grammar) if (t2 && e.Worker) {
            var c2 = new Worker(a.filename);
            c2.onmessage = function(e2) {
              u2(e2.data);
            }, c2.postMessage(JSON.stringify({ language: s2.language, code: s2.code, immediateClose: true }));
          } else u2(a.highlight(s2.code, s2.grammar, s2.language));
          else u2(a.util.encode(s2.code));
        }, highlight: function(e2, n2, t2) {
          var r2 = { code: e2, grammar: n2, language: t2 };
          if (a.hooks.run("before-tokenize", r2), !r2.grammar) throw new Error('The language "' + r2.language + '" has no grammar.');
          return r2.tokens = a.tokenize(r2.code, r2.grammar), a.hooks.run("after-tokenize", r2), i.stringify(a.util.encode(r2.tokens), r2.language);
        }, tokenize: function(e2, n2) {
          var t2 = n2.rest;
          if (t2) {
            for (var r2 in t2) n2[r2] = t2[r2];
            delete n2.rest;
          }
          var a2 = new s();
          return u(a2, a2.head, e2), o(e2, a2, n2, a2.head, 0), function(e3) {
            for (var n3 = [], t3 = e3.head.next; t3 !== e3.tail; ) n3.push(t3.value), t3 = t3.next;
            return n3;
          }(a2);
        }, hooks: { all: {}, add: function(e2, n2) {
          var t2 = a.hooks.all;
          t2[e2] = t2[e2] || [], t2[e2].push(n2);
        }, run: function(e2, n2) {
          var t2 = a.hooks.all[e2];
          if (t2 && t2.length) for (var r2, i2 = 0; r2 = t2[i2++]; ) r2(n2);
        } }, Token: i };
        function i(e2, n2, t2, r2) {
          this.type = e2, this.content = n2, this.alias = t2, this.length = 0 | (r2 || "").length;
        }
        function l(e2, n2, t2, r2) {
          e2.lastIndex = n2;
          var a2 = e2.exec(t2);
          if (a2 && r2 && a2[1]) {
            var i2 = a2[1].length;
            a2.index += i2, a2[0] = a2[0].slice(i2);
          }
          return a2;
        }
        function o(e2, n2, t2, r2, s2, g2) {
          for (var f2 in t2) if (t2.hasOwnProperty(f2) && t2[f2]) {
            var h2 = t2[f2];
            h2 = Array.isArray(h2) ? h2 : [h2];
            for (var d = 0; d < h2.length; ++d) {
              if (g2 && g2.cause == f2 + "," + d) return;
              var v = h2[d], p = v.inside, m = !!v.lookbehind, y = !!v.greedy, k = v.alias;
              if (y && !v.pattern.global) {
                var x = v.pattern.toString().match(/[imsuy]*$/)[0];
                v.pattern = RegExp(v.pattern.source, x + "g");
              }
              for (var b = v.pattern || v, w = r2.next, A = s2; w !== n2.tail && !(g2 && A >= g2.reach); A += w.value.length, w = w.next) {
                var E = w.value;
                if (n2.length > e2.length) return;
                if (!(E instanceof i)) {
                  var P, L = 1;
                  if (y) {
                    if (!(P = l(b, A, e2, m)) || P.index >= e2.length) break;
                    var S = P.index, O = P.index + P[0].length, j = A;
                    for (j += w.value.length; S >= j; ) j += (w = w.next).value.length;
                    if (A = j -= w.value.length, w.value instanceof i) continue;
                    for (var C = w; C !== n2.tail && (j < O || "string" == typeof C.value); C = C.next) L++, j += C.value.length;
                    L--, E = e2.slice(A, j), P.index -= A;
                  } else if (!(P = l(b, 0, E, m))) continue;
                  S = P.index;
                  var N = P[0], _ = E.slice(0, S), M = E.slice(S + N.length), W = A + E.length;
                  g2 && W > g2.reach && (g2.reach = W);
                  var z = w.prev;
                  if (_ && (z = u(n2, z, _), A += _.length), c(n2, z, L), w = u(n2, z, new i(f2, p ? a.tokenize(N, p) : N, k, N)), M && u(n2, w, M), L > 1) {
                    var I = { cause: f2 + "," + d, reach: W };
                    o(e2, n2, t2, w.prev, A, I), g2 && I.reach > g2.reach && (g2.reach = I.reach);
                  }
                }
              }
            }
          }
        }
        function s() {
          var e2 = { value: null, prev: null, next: null }, n2 = { value: null, prev: e2, next: null };
          e2.next = n2, this.head = e2, this.tail = n2, this.length = 0;
        }
        function u(e2, n2, t2) {
          var r2 = n2.next, a2 = { value: t2, prev: n2, next: r2 };
          return n2.next = a2, r2.prev = a2, e2.length++, a2;
        }
        function c(e2, n2, t2) {
          for (var r2 = n2.next, a2 = 0; a2 < t2 && r2 !== e2.tail; a2++) r2 = r2.next;
          n2.next = r2, r2.prev = n2, e2.length -= a2;
        }
        if (e.Prism = a, i.stringify = function e2(n2, t2) {
          if ("string" == typeof n2) return n2;
          if (Array.isArray(n2)) {
            var r2 = "";
            return n2.forEach(function(n3) {
              r2 += e2(n3, t2);
            }), r2;
          }
          var i2 = { type: n2.type, content: e2(n2.content, t2), tag: "span", classes: ["token", n2.type], attributes: {}, language: t2 }, l2 = n2.alias;
          l2 && (Array.isArray(l2) ? Array.prototype.push.apply(i2.classes, l2) : i2.classes.push(l2)), a.hooks.run("wrap", i2);
          var o2 = "";
          for (var s2 in i2.attributes) o2 += " " + s2 + '="' + (i2.attributes[s2] || "").replace(/"/g, "&quot;") + '"';
          return "<" + i2.tag + ' class="' + i2.classes.join(" ") + '"' + o2 + ">" + i2.content + "</" + i2.tag + ">";
        }, !e.document) return e.addEventListener ? (a.disableWorkerMessageHandler || e.addEventListener("message", function(n2) {
          var t2 = JSON.parse(n2.data), r2 = t2.language, i2 = t2.code, l2 = t2.immediateClose;
          e.postMessage(a.highlight(i2, a.languages[r2], r2)), l2 && e.close();
        }, false), a) : a;
        var g = a.util.currentScript();
        function f() {
          a.manual || a.highlightAll();
        }
        if (g && (a.filename = g.src, g.hasAttribute("data-manual") && (a.manual = true)), !a.manual) {
          var h = document.readyState;
          "loading" === h || "interactive" === h && g && g.defer ? document.addEventListener("DOMContentLoaded", f) : window.requestAnimationFrame ? window.requestAnimationFrame(f) : window.setTimeout(f, 16);
        }
        return a;
      }(_self);
      "undefined" != typeof module && module.exports && (module.exports = Prism), "undefined" != typeof global && (global.Prism = Prism);
      Prism.languages.markup = { comment: { pattern: /<!--(?:(?!<!--)[\s\S])*?-->/, greedy: true }, prolog: { pattern: /<\?[\s\S]+?\?>/, greedy: true }, doctype: { pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i, greedy: true, inside: { "internal-subset": { pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/, lookbehind: true, greedy: true, inside: null }, string: { pattern: /"[^"]*"|'[^']*'/, greedy: true }, punctuation: /^<!|>$|[[\]]/, "doctype-tag": /^DOCTYPE/i, name: /[^\s<>'"]+/ } }, cdata: { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, greedy: true }, tag: { pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/, greedy: true, inside: { tag: { pattern: /^<\/?[^\s>\/]+/, inside: { punctuation: /^<\/?/, namespace: /^[^\s>\/:]+:/ } }, "special-attr": [], "attr-value": { pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/, inside: { punctuation: [{ pattern: /^=/, alias: "attr-equals" }, { pattern: /^(\s*)["']|["']$/, lookbehind: true }] } }, punctuation: /\/?>/, "attr-name": { pattern: /[^\s>\/]+/, inside: { namespace: /^[^\s>\/:]+:/ } } } }, entity: [{ pattern: /&[\da-z]{1,8};/i, alias: "named-entity" }, /&#x?[\da-f]{1,8};/i] }, Prism.languages.markup.tag.inside["attr-value"].inside.entity = Prism.languages.markup.entity, Prism.languages.markup.doctype.inside["internal-subset"].inside = Prism.languages.markup, Prism.hooks.add("wrap", function(a) {
        "entity" === a.type && (a.attributes.title = a.content.replace(/&amp;/, "&"));
      }), Object.defineProperty(Prism.languages.markup.tag, "addInlined", { value: function(a, e) {
        var s = {};
        s["language-" + e] = { pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i, lookbehind: true, inside: Prism.languages[e] }, s.cdata = /^<!\[CDATA\[|\]\]>$/i;
        var t = { "included-cdata": { pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i, inside: s } };
        t["language-" + e] = { pattern: /[\s\S]+/, inside: Prism.languages[e] };
        var n = {};
        n[a] = { pattern: RegExp("(<__[^>]*>)(?:<!\\[CDATA\\[(?:[^\\]]|\\](?!\\]>))*\\]\\]>|(?!<!\\[CDATA\\[)[^])*?(?=</__>)".replace(/__/g, function() {
          return a;
        }), "i"), lookbehind: true, greedy: true, inside: t }, Prism.languages.insertBefore("markup", "cdata", n);
      } }), Object.defineProperty(Prism.languages.markup.tag, "addAttribute", { value: function(a, e) {
        Prism.languages.markup.tag.inside["special-attr"].push({ pattern: RegExp(`(^|["'\\s])(?:` + a + `)\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s'">=]+(?=[\\s>]))`, "i"), lookbehind: true, inside: { "attr-name": /^[^\s=]+/, "attr-value": { pattern: /=[\s\S]+/, inside: { value: { pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/, lookbehind: true, alias: [e, "language-" + e], inside: Prism.languages[e] }, punctuation: [{ pattern: /^=/, alias: "attr-equals" }, /"|'/] } } } });
      } }), Prism.languages.html = Prism.languages.markup, Prism.languages.mathml = Prism.languages.markup, Prism.languages.svg = Prism.languages.markup, Prism.languages.xml = Prism.languages.extend("markup", {}), Prism.languages.ssml = Prism.languages.xml, Prism.languages.atom = Prism.languages.xml, Prism.languages.rss = Prism.languages.xml;
      !function(s) {
        var e = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
        s.languages.css = { comment: /\/\*[\s\S]*?\*\//, atrule: { pattern: RegExp(`@[\\w-](?:[^;{\\s"']|\\s+(?!\\s)|` + e.source + ")*?(?:;|(?=\\s*\\{))"), inside: { rule: /^@[\w-]+/, "selector-function-argument": { pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/, lookbehind: true, alias: "selector" }, keyword: { pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/, lookbehind: true } } }, url: { pattern: RegExp("\\burl\\((?:" + e.source + `|(?:[^\\\\\r
()"']|\\\\[^])*)\\)`, "i"), greedy: true, inside: { function: /^url/i, punctuation: /^\(|\)$/, string: { pattern: RegExp("^" + e.source + "$"), alias: "url" } } }, selector: { pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + e.source + ")*(?=\\s*\\{)"), lookbehind: true }, string: { pattern: e, greedy: true }, property: { pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i, lookbehind: true }, important: /!important\b/i, function: { pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i, lookbehind: true }, punctuation: /[(){};:,]/ }, s.languages.css.atrule.inside.rest = s.languages.css;
        var t = s.languages.markup;
        t && (t.tag.addInlined("style", "css"), t.tag.addAttribute("style", "css"));
      }(Prism);
      Prism.languages.clike = { comment: [{ pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true }, { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true }], string: { pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/, greedy: true }, "class-name": { pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i, lookbehind: true, inside: { punctuation: /[.\\]/ } }, keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/, boolean: /\b(?:false|true)\b/, function: /\b\w+(?=\()/, number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i, operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/, punctuation: /[{}[\];(),.:]/ };
      Prism.languages.javascript = Prism.languages.extend("clike", { "class-name": [Prism.languages.clike["class-name"], { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/, lookbehind: true }], keyword: [{ pattern: /((?:^|\})\s*)catch\b/, lookbehind: true }, { pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/, lookbehind: true }], function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/, number: { pattern: RegExp("(^|[^\\w$])(?:NaN|Infinity|0[bB][01]+(?:_[01]+)*n?|0[oO][0-7]+(?:_[0-7]+)*n?|0[xX][\\dA-Fa-f]+(?:_[\\dA-Fa-f]+)*n?|\\d+(?:_\\d+)*n|(?:\\d+(?:_\\d+)*(?:\\.(?:\\d+(?:_\\d+)*)?)?|\\.\\d+(?:_\\d+)*)(?:[Ee][+-]?\\d+(?:_\\d+)*)?)(?![\\w$])"), lookbehind: true }, operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/ }), Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/, Prism.languages.insertBefore("javascript", "keyword", { regex: { pattern: RegExp(`((?:^|[^$\\w\\xA0-\\uFFFF."'\\])\\s]|\\b(?:return|yield))\\s*)/(?:(?:\\[(?:[^\\]\\\\\r
]|\\\\.)*\\]|\\\\.|[^/\\\\\\[\r
])+/[dgimyus]{0,7}|(?:\\[(?:[^[\\]\\\\\r
]|\\\\.|\\[(?:[^[\\]\\\\\r
]|\\\\.|\\[(?:[^[\\]\\\\\r
]|\\\\.)*\\])*\\])*\\]|\\\\.|[^/\\\\\\[\r
])+/[dgimyus]{0,7}v[dgimyus]{0,7})(?=(?:\\s|/\\*(?:[^*]|\\*(?!/))*\\*/)*(?:$|[\r
,.;:})\\]]|//))`), lookbehind: true, greedy: true, inside: { "regex-source": { pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/, lookbehind: true, alias: "language-regex", inside: Prism.languages.regex }, "regex-delimiter": /^\/|\/$/, "regex-flags": /^[a-z]+$/ } }, "function-variable": { pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/, alias: "function" }, parameter: [{ pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/, lookbehind: true, inside: Prism.languages.javascript }, { pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/, lookbehind: true, inside: Prism.languages.javascript }], constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/ }), Prism.languages.insertBefore("javascript", "string", { hashbang: { pattern: /^#!.*/, greedy: true, alias: "comment" }, "template-string": { pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/, greedy: true, inside: { "template-punctuation": { pattern: /^`|`$/, alias: "string" }, interpolation: { pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/, lookbehind: true, inside: { "interpolation-punctuation": { pattern: /^\$\{|\}$/, alias: "punctuation" }, rest: Prism.languages.javascript } }, string: /[\s\S]+/ } }, "string-property": { pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m, lookbehind: true, greedy: true, alias: "property" } }), Prism.languages.insertBefore("javascript", "operator", { "literal-property": { pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m, lookbehind: true, alias: "property" } }), Prism.languages.markup && (Prism.languages.markup.tag.addInlined("script", "javascript"), Prism.languages.markup.tag.addAttribute("on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)", "javascript")), Prism.languages.js = Prism.languages.javascript;
      !function() {
        if ("undefined" != typeof Prism && "undefined" != typeof document && document.querySelector) {
          var e, t = "line-numbers", i = "linkable-line-numbers", n = /\n(?!$)/g, r = true;
          Prism.plugins.lineHighlight = { highlightLines: function(o2, u2, c2) {
            var h = (u2 = "string" == typeof u2 ? u2 : o2.getAttribute("data-line") || "").replace(/\s+/g, "").split(",").filter(Boolean), d = +o2.getAttribute("data-line-offset") || 0, f = (function() {
              if (void 0 === e) {
                var t2 = document.createElement("div");
                t2.style.fontSize = "13px", t2.style.lineHeight = "1.5", t2.style.padding = "0", t2.style.border = "0", t2.innerHTML = "&nbsp;<br />&nbsp;", document.body.appendChild(t2), e = 38 === t2.offsetHeight, document.body.removeChild(t2);
              }
              return e;
            }() ? parseInt : parseFloat)(getComputedStyle(o2).lineHeight), p = Prism.util.isActive(o2, t), g = o2.querySelector("code"), m = p ? o2 : g || o2, v = [], y = g.textContent.match(n), b = y ? y.length + 1 : 1, A = g && m != g ? function(e2, t2) {
              var i2 = getComputedStyle(e2), n2 = getComputedStyle(t2);
              function r2(e3) {
                return +e3.substr(0, e3.length - 2);
              }
              return t2.offsetTop + r2(n2.borderTopWidth) + r2(n2.paddingTop) - r2(i2.paddingTop);
            }(o2, g) : 0;
            h.forEach(function(e2) {
              var t2 = e2.split("-"), i2 = +t2[0], n2 = +t2[1] || i2;
              if (!((n2 = Math.min(b + d, n2)) < i2)) {
                var r2 = o2.querySelector('.line-highlight[data-range="' + e2 + '"]') || document.createElement("div");
                if (v.push(function() {
                  r2.setAttribute("aria-hidden", "true"), r2.setAttribute("data-range", e2), r2.className = (c2 || "") + " line-highlight";
                }), p && Prism.plugins.lineNumbers) {
                  var s2 = Prism.plugins.lineNumbers.getLine(o2, i2), l2 = Prism.plugins.lineNumbers.getLine(o2, n2);
                  if (s2) {
                    var a2 = s2.offsetTop + A + "px";
                    v.push(function() {
                      r2.style.top = a2;
                    });
                  }
                  if (l2) {
                    var u3 = l2.offsetTop - s2.offsetTop + l2.offsetHeight + "px";
                    v.push(function() {
                      r2.style.height = u3;
                    });
                  }
                } else v.push(function() {
                  r2.setAttribute("data-start", String(i2)), n2 > i2 && r2.setAttribute("data-end", String(n2)), r2.style.top = (i2 - d - 1) * f + A + "px", r2.textContent = new Array(n2 - i2 + 2).join(" \n");
                });
                v.push(function() {
                  r2.style.width = o2.scrollWidth + "px";
                }), v.push(function() {
                  m.appendChild(r2);
                });
              }
            });
            var P = o2.id;
            if (p && Prism.util.isActive(o2, i) && P) {
              l(o2, i) || v.push(function() {
                o2.classList.add(i);
              });
              var E = parseInt(o2.getAttribute("data-start") || "1");
              s(".line-numbers-rows > span", o2).forEach(function(e2, t2) {
                var i2 = t2 + E;
                e2.onclick = function() {
                  var e3 = P + "." + i2;
                  r = false, location.hash = e3, setTimeout(function() {
                    r = true;
                  }, 1);
                };
              });
            }
            return function() {
              v.forEach(a);
            };
          } };
          var o = 0;
          Prism.hooks.add("before-sanity-check", function(e2) {
            var t2 = e2.element.parentElement;
            if (u(t2)) {
              var i2 = 0;
              s(".line-highlight", t2).forEach(function(e3) {
                i2 += e3.textContent.length, e3.parentNode.removeChild(e3);
              }), i2 && /^(?: \n)+$/.test(e2.code.slice(-i2)) && (e2.code = e2.code.slice(0, -i2));
            }
          }), Prism.hooks.add("complete", function e2(i2) {
            var n2 = i2.element.parentElement;
            if (u(n2)) {
              clearTimeout(o);
              var r2 = Prism.plugins.lineNumbers, s2 = i2.plugins && i2.plugins.lineNumbers;
              l(n2, t) && r2 && !s2 ? Prism.hooks.add("line-numbers", e2) : (Prism.plugins.lineHighlight.highlightLines(n2)(), o = setTimeout(c, 1));
            }
          }), window.addEventListener("hashchange", c), window.addEventListener("resize", function() {
            s("pre").filter(u).map(function(e2) {
              return Prism.plugins.lineHighlight.highlightLines(e2);
            }).forEach(a);
          });
        }
        function s(e2, t2) {
          return Array.prototype.slice.call((t2 || document).querySelectorAll(e2));
        }
        function l(e2, t2) {
          return e2.classList.contains(t2);
        }
        function a(e2) {
          e2();
        }
        function u(e2) {
          return !!(e2 && /pre/i.test(e2.nodeName) && (e2.hasAttribute("data-line") || e2.id && Prism.util.isActive(e2, i)));
        }
        function c() {
          var e2 = location.hash.slice(1);
          s(".temporary.line-highlight").forEach(function(e3) {
            e3.parentNode.removeChild(e3);
          });
          var t2 = (e2.match(/\.([\d,-]+)$/) || [, ""])[1];
          if (t2 && !document.getElementById(e2)) {
            var i2 = e2.slice(0, e2.lastIndexOf(".")), n2 = document.getElementById(i2);
            n2 && (n2.hasAttribute("data-line") || n2.setAttribute("data-line", ""), Prism.plugins.lineHighlight.highlightLines(n2, t2, "temporary ")(), r && document.querySelector(".temporary.line-highlight").scrollIntoView());
          }
        }
      }();
      !function() {
        if ("undefined" != typeof Prism && "undefined" != typeof document) {
          var e = { javascript: "clike", actionscript: "javascript", apex: ["clike", "sql"], arduino: "cpp", aspnet: ["markup", "csharp"], birb: "clike", bison: "c", c: "clike", csharp: "clike", cpp: "c", cfscript: "clike", chaiscript: ["clike", "cpp"], cilkc: "c", cilkcpp: "cpp", coffeescript: "javascript", crystal: "ruby", "css-extras": "css", d: "clike", dart: "clike", django: "markup-templating", ejs: ["javascript", "markup-templating"], etlua: ["lua", "markup-templating"], erb: ["ruby", "markup-templating"], fsharp: "clike", "firestore-security-rules": "clike", flow: "javascript", ftl: "markup-templating", gml: "clike", glsl: "c", go: "clike", gradle: "clike", groovy: "clike", haml: "ruby", handlebars: "markup-templating", haxe: "clike", hlsl: "c", idris: "haskell", java: "clike", javadoc: ["markup", "java", "javadoclike"], jolie: "clike", jsdoc: ["javascript", "javadoclike", "typescript"], "js-extras": "javascript", json5: "json", jsonp: "json", "js-templates": "javascript", kotlin: "clike", latte: ["clike", "markup-templating", "php"], less: "css", lilypond: "scheme", liquid: "markup-templating", markdown: "markup", "markup-templating": "markup", mongodb: "javascript", n4js: "javascript", objectivec: "c", opencl: "c", parser: "markup", php: "markup-templating", phpdoc: ["php", "javadoclike"], "php-extras": "php", plsql: "sql", processing: "clike", protobuf: "clike", pug: ["markup", "javascript"], purebasic: "clike", purescript: "haskell", qsharp: "clike", qml: "javascript", qore: "clike", racket: "scheme", cshtml: ["markup", "csharp"], jsx: ["markup", "javascript"], tsx: ["jsx", "typescript"], reason: "clike", ruby: "clike", sass: "css", scss: "css", scala: "java", "shell-session": "bash", smarty: "markup-templating", solidity: "clike", soy: "markup-templating", sparql: "turtle", sqf: "clike", squirrel: "clike", stata: ["mata", "java", "python"], "t4-cs": ["t4-templating", "csharp"], "t4-vb": ["t4-templating", "vbnet"], tap: "yaml", tt2: ["clike", "markup-templating"], textile: "markup", twig: "markup-templating", typescript: "javascript", v: "clike", vala: "clike", vbnet: "basic", velocity: "markup", wiki: "markup", xeora: "markup", "xml-doc": "markup", xquery: "markup" }, a = { html: "markup", xml: "markup", svg: "markup", mathml: "markup", ssml: "markup", atom: "markup", rss: "markup", js: "javascript", g4: "antlr4", ino: "arduino", "arm-asm": "armasm", art: "arturo", adoc: "asciidoc", avs: "avisynth", avdl: "avro-idl", gawk: "awk", sh: "bash", shell: "bash", shortcode: "bbcode", rbnf: "bnf", oscript: "bsl", cs: "csharp", dotnet: "csharp", cfc: "cfscript", "cilk-c": "cilkc", "cilk-cpp": "cilkcpp", cilk: "cilkcpp", coffee: "coffeescript", conc: "concurnas", jinja2: "django", "dns-zone": "dns-zone-file", dockerfile: "docker", gv: "dot", eta: "ejs", xlsx: "excel-formula", xls: "excel-formula", gamemakerlanguage: "gml", po: "gettext", gni: "gn", ld: "linker-script", "go-mod": "go-module", hbs: "handlebars", mustache: "handlebars", hs: "haskell", idr: "idris", gitignore: "ignore", hgignore: "ignore", npmignore: "ignore", webmanifest: "json", kt: "kotlin", kts: "kotlin", kum: "kumir", tex: "latex", context: "latex", ly: "lilypond", emacs: "lisp", elisp: "lisp", "emacs-lisp": "lisp", md: "markdown", moon: "moonscript", n4jsd: "n4js", nani: "naniscript", objc: "objectivec", qasm: "openqasm", objectpascal: "pascal", px: "pcaxis", pcode: "peoplecode", plantuml: "plant-uml", pq: "powerquery", mscript: "powerquery", pbfasm: "purebasic", purs: "purescript", py: "python", qs: "qsharp", rkt: "racket", razor: "cshtml", rpy: "renpy", res: "rescript", robot: "robotframework", rb: "ruby", "sh-session": "shell-session", shellsession: "shell-session", smlnj: "sml", sol: "solidity", sln: "solution-file", rq: "sparql", sclang: "supercollider", t4: "t4-cs", trickle: "tremor", troy: "tremor", trig: "turtle", ts: "typescript", tsconfig: "typoscript", uscript: "unrealscript", uc: "unrealscript", url: "uri", vb: "visual-basic", vba: "visual-basic", webidl: "web-idl", mathematica: "wolfram", nb: "wolfram", wl: "wolfram", xeoracube: "xeora", yml: "yaml" }, r = {}, s = "components/", i = Prism.util.currentScript();
          if (i) {
            var t = /\bplugins\/autoloader\/prism-autoloader\.(?:min\.)?js(?:\?[^\r\n/]*)?$/i, c = /(^|\/)[\w-]+\.(?:min\.)?js(?:\?[^\r\n/]*)?$/i, l = i.getAttribute("data-autoloader-path");
            if (null != l) s = l.trim().replace(/\/?$/, "/");
            else {
              var p = i.src;
              t.test(p) ? s = p.replace(t, "components/") : c.test(p) && (s = p.replace(c, "$1components/"));
            }
          }
          var n = Prism.plugins.autoloader = { languages_path: s, use_minified: true, loadLanguages: m };
          Prism.hooks.add("complete", function(e2) {
            var a2 = e2.element, r2 = e2.language;
            if (a2 && r2 && "none" !== r2) {
              var s2 = function(e3) {
                var a3 = (e3.getAttribute("data-dependencies") || "").trim();
                if (!a3) {
                  var r3 = e3.parentElement;
                  r3 && "pre" === r3.tagName.toLowerCase() && (a3 = (r3.getAttribute("data-dependencies") || "").trim());
                }
                return a3 ? a3.split(/\s*,\s*/g) : [];
              }(a2);
              /^diff-./i.test(r2) ? (s2.push("diff"), s2.push(r2.substr("diff-".length))) : s2.push(r2), s2.every(o) || m(s2, function() {
                Prism.highlightElement(a2);
              });
            }
          });
        }
        function o(e2) {
          if (e2.indexOf("!") >= 0) return false;
          if ((e2 = a[e2] || e2) in Prism.languages) return true;
          var s2 = r[e2];
          return s2 && !s2.error && false === s2.loading;
        }
        function m(s2, i2, t2) {
          "string" == typeof s2 && (s2 = [s2]);
          var c2 = s2.length, l2 = 0, p2 = false;
          function k() {
            p2 || ++l2 === c2 && i2 && i2(s2);
          }
          0 !== c2 ? s2.forEach(function(s3) {
            !function(s4, i3, t3) {
              var c3 = s4.indexOf("!") >= 0;
              function l3() {
                var e2 = r[s4];
                e2 || (e2 = r[s4] = { callbacks: [] }), e2.callbacks.push({ success: i3, error: t3 }), !c3 && o(s4) ? u(s4, "success") : !c3 && e2.error ? u(s4, "error") : !c3 && e2.loading || (e2.loading = true, e2.error = false, function(e3, a2, r2) {
                  var s5 = document.createElement("script");
                  s5.src = e3, s5.async = true, s5.onload = function() {
                    document.body.removeChild(s5), a2 && a2();
                  }, s5.onerror = function() {
                    document.body.removeChild(s5), r2 && r2();
                  }, document.body.appendChild(s5);
                }(function(e3) {
                  return n.languages_path + "prism-" + e3 + (n.use_minified ? ".min" : "") + ".js";
                }(s4), function() {
                  e2.loading = false, u(s4, "success");
                }, function() {
                  e2.loading = false, e2.error = true, u(s4, "error");
                }));
              }
              s4 = s4.replace("!", "");
              var p3 = e[s4 = a[s4] || s4];
              p3 && p3.length ? m(p3, l3, t3) : l3();
            }(s3, k, function() {
              p2 || (p2 = true, t2 && t2(s3));
            });
          }) : i2 && setTimeout(i2, 0);
        }
        function u(e2, a2) {
          if (r[e2]) {
            for (var s2 = r[e2].callbacks, i2 = 0, t2 = s2.length; i2 < t2; i2++) {
              var c2 = s2[i2][a2];
              c2 && setTimeout(c2, 0);
            }
            s2.length = 0;
          }
        }
      }();
      !function() {
        if ("undefined" != typeof Prism && "undefined" != typeof document) {
          var e = [], t = {}, n = function() {
          };
          Prism.plugins.toolbar = {};
          var a = Prism.plugins.toolbar.registerButton = function(n2, a2) {
            var r2;
            r2 = "function" == typeof a2 ? a2 : function(e2) {
              var t2;
              return "function" == typeof a2.onClick ? ((t2 = document.createElement("button")).type = "button", t2.addEventListener("click", function() {
                a2.onClick.call(this, e2);
              })) : "string" == typeof a2.url ? (t2 = document.createElement("a")).href = a2.url : t2 = document.createElement("span"), a2.className && t2.classList.add(a2.className), t2.textContent = a2.text, t2;
            }, n2 in t ? console.warn('There is a button with the key "' + n2 + '" registered already.') : e.push(t[n2] = r2);
          }, r = Prism.plugins.toolbar.hook = function(a2) {
            var r2 = a2.element.parentNode;
            if (r2 && /pre/i.test(r2.nodeName) && !r2.parentNode.classList.contains("code-toolbar")) {
              var o = document.createElement("div");
              o.classList.add("code-toolbar"), r2.parentNode.insertBefore(o, r2), o.appendChild(r2);
              var i = document.createElement("div");
              i.classList.add("toolbar");
              var l = e, d = function(e2) {
                for (; e2; ) {
                  var t2 = e2.getAttribute("data-toolbar-order");
                  if (null != t2) return (t2 = t2.trim()).length ? t2.split(/\s*,\s*/g) : [];
                  e2 = e2.parentElement;
                }
              }(a2.element);
              d && (l = d.map(function(e2) {
                return t[e2] || n;
              })), l.forEach(function(e2) {
                var t2 = e2(a2);
                if (t2) {
                  var n2 = document.createElement("div");
                  n2.classList.add("toolbar-item"), n2.appendChild(t2), i.appendChild(n2);
                }
              }), o.appendChild(i);
            }
          };
          a("label", function(e2) {
            var t2 = e2.element.parentNode;
            if (t2 && /pre/i.test(t2.nodeName) && t2.hasAttribute("data-label")) {
              var n2, a2, r2 = t2.getAttribute("data-label");
              try {
                a2 = document.querySelector("template#" + r2);
              } catch (e3) {
              }
              return a2 ? n2 = a2.content : (t2.hasAttribute("data-url") ? (n2 = document.createElement("a")).href = t2.getAttribute("data-url") : n2 = document.createElement("span"), n2.textContent = r2), n2;
            }
          }), Prism.hooks.add("complete", r);
        }
      }();
      !function() {
        function t(t2) {
          var e = document.createElement("textarea");
          e.value = t2.getText(), e.style.top = "0", e.style.left = "0", e.style.position = "fixed", document.body.appendChild(e), e.focus(), e.select();
          try {
            var o = document.execCommand("copy");
            setTimeout(function() {
              o ? t2.success() : t2.error();
            }, 1);
          } catch (e2) {
            setTimeout(function() {
              t2.error(e2);
            }, 1);
          }
          document.body.removeChild(e);
        }
        "undefined" != typeof Prism && "undefined" != typeof document && (Prism.plugins.toolbar ? Prism.plugins.toolbar.registerButton("copy-to-clipboard", function(e) {
          var o = e.element, n = function(t2) {
            var e2 = { copy: "Copy", "copy-error": "Press Ctrl+C to copy", "copy-success": "Copied!", "copy-timeout": 5e3 };
            for (var o2 in e2) {
              for (var n2 = "data-prismjs-" + o2, c2 = t2; c2 && !c2.hasAttribute(n2); ) c2 = c2.parentElement;
              c2 && (e2[o2] = c2.getAttribute(n2));
            }
            return e2;
          }(o), c = document.createElement("button");
          c.className = "copy-to-clipboard-button", c.setAttribute("type", "button");
          var r = document.createElement("span");
          return c.appendChild(r), u("copy"), function(e2, o2) {
            e2.addEventListener("click", function() {
              !function(e3) {
                navigator.clipboard ? navigator.clipboard.writeText(e3.getText()).then(e3.success, function() {
                  t(e3);
                }) : t(e3);
              }(o2);
            });
          }(c, { getText: function() {
            return o.textContent;
          }, success: function() {
            u("copy-success"), i();
          }, error: function() {
            u("copy-error"), setTimeout(function() {
              !function(t2) {
                window.getSelection().selectAllChildren(t2);
              }(o);
            }, 1), i();
          } }), c;
          function i() {
            setTimeout(function() {
              u("copy");
            }, n["copy-timeout"]);
          }
          function u(t2) {
            r.textContent = n[t2], c.setAttribute("data-copy-state", t2);
          }
        }) : console.warn("Copy to Clipboard plugin loaded before Toolbar plugin."));
      }();
      Prism.plugins.autoloader.languages_path = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
      function highlight() {
        document.querySelectorAll("pre:not(.emgithub-pre)").forEach((e) => {
          Prism.highlightAllUnder(e, false, () => {
            requestAnimationFrame(() => {
              e.classList.remove("hide");
            });
          });
        });
      }
      window.addEventListener("DOMContentLoaded", () => {
        highlight();
      });
    }
  });
  require_stdin();
})();
