var me = Object.defineProperty;
var be = (r, e, t) => e in r ? me(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var g = (r, e, t) => be(r, typeof e != "symbol" ? e + "" : e, t);
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, Z = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, J = Symbol(), X = /* @__PURE__ */ new WeakMap();
let ce = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== J) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Z && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = X.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && X.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const $e = (r) => new ce(typeof r == "string" ? r : r + "", void 0, J), T = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce((s, i, n) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[n + 1], r[0]);
  return new ce(t, r, J);
}, ve = (r, e) => {
  if (Z) r.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), i = M.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = t.cssText, r.appendChild(s);
  }
}, Y = Z ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return $e(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ye, defineProperty: xe, getOwnPropertyDescriptor: _e, getOwnPropertyNames: Ae, getOwnPropertySymbols: Ee, getPrototypeOf: we } = Object, v = globalThis, ee = v.trustedTypes, Se = ee ? ee.emptyScript : "", F = v.reactiveElementPolyfillSupport, C = (r, e) => r, B = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? Se : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, he = (r, e) => !ye(r, e), te = { attribute: !0, type: String, converter: B, reflect: !1, useDefault: !1, hasChanged: he };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), v.litPropertyMetadata ?? (v.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let E = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = te) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(e, s, t);
      i !== void 0 && xe(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: i, set: n } = _e(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: i, set(o) {
      const l = i == null ? void 0 : i.call(this);
      n == null || n.call(this, o), this.requestUpdate(e, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? te;
  }
  static _$Ei() {
    if (this.hasOwnProperty(C("elementProperties"))) return;
    const e = we(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(C("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(C("properties"))) {
      const t = this.properties, s = [...Ae(t), ...Ee(t)];
      for (const i of s) this.createProperty(i, t[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, i] of t) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const i = this._$Eu(t, s);
      i !== void 0 && this._$Eh.set(i, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const i of s) t.unshift(Y(i));
    } else e !== void 0 && t.push(Y(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ve(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostConnected) == null ? void 0 : s.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var s;
      return (s = t.hostDisconnected) == null ? void 0 : s.call(t);
    });
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    var n;
    const s = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, s);
    if (i !== void 0 && s.reflect === !0) {
      const o = (((n = s.converter) == null ? void 0 : n.toAttribute) !== void 0 ? s.converter : B).toAttribute(t, s.type);
      this._$Em = e, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var n, o;
    const s = this.constructor, i = s._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const l = s.getPropertyOptions(i), a = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((n = l.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? l.converter : B;
      this._$Em = i;
      const d = a.fromAttribute(t, l.type);
      this[i] = d ?? ((o = this._$Ej) == null ? void 0 : o.get(i)) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, i = !1, n) {
    var o;
    if (e !== void 0) {
      const l = this.constructor;
      if (i === !1 && (n = this[e]), s ?? (s = l.getPropertyOptions(e)), !((s.hasChanged ?? he)(n, t) || s.useDefault && s.reflect && n === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(l._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: i, wrapped: n }, o) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), n !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, o] of this._$Ep) this[n] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, o] of i) {
        const { wrapped: l } = o, a = this[n];
        l !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, o, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (s = this._$EO) == null || s.forEach((i) => {
        var n;
        return (n = i.hostUpdate) == null ? void 0 : n.call(i);
      }), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((s) => {
      var i;
      return (i = s.hostUpdated) == null ? void 0 : i.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[C("elementProperties")] = /* @__PURE__ */ new Map(), E[C("finalized")] = /* @__PURE__ */ new Map(), F == null || F({ ReactiveElement: E }), (v.reactiveElementVersions ?? (v.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const P = globalThis, se = (r) => r, N = P.trustedTypes, ie = N ? N.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, pe = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, ue = "?" + $, ke = `<${ue}>`, A = document, z = () => A.createComment(""), O = (r) => r === null || typeof r != "object" && typeof r != "function", K = Array.isArray, Ce = (r) => K(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", I = `[ 	
\f\r]`, k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, re = /-->/g, ne = />/g, y = RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), oe = /'/g, ae = /"/g, ge = /^(?:script|style|textarea|title)$/i, Pe = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), p = Pe(1), w = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), le = /* @__PURE__ */ new WeakMap(), x = A.createTreeWalker(A, 129);
function fe(r, e) {
  if (!K(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ie !== void 0 ? ie.createHTML(e) : e;
}
const ze = (r, e) => {
  const t = r.length - 1, s = [];
  let i, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = k;
  for (let l = 0; l < t; l++) {
    const a = r[l];
    let d, h, c = -1, f = 0;
    for (; f < a.length && (o.lastIndex = f, h = o.exec(a), h !== null); ) f = o.lastIndex, o === k ? h[1] === "!--" ? o = re : h[1] !== void 0 ? o = ne : h[2] !== void 0 ? (ge.test(h[2]) && (i = RegExp("</" + h[2], "g")), o = y) : h[3] !== void 0 && (o = y) : o === y ? h[0] === ">" ? (o = i ?? k, c = -1) : h[1] === void 0 ? c = -2 : (c = o.lastIndex - h[2].length, d = h[1], o = h[3] === void 0 ? y : h[3] === '"' ? ae : oe) : o === ae || o === oe ? o = y : o === re || o === ne ? o = k : (o = y, i = void 0);
    const b = o === y && r[l + 1].startsWith("/>") ? " " : "";
    n += o === k ? a + ke : c >= 0 ? (s.push(d), a.slice(0, c) + pe + a.slice(c) + $ + b) : a + $ + (c === -2 ? l : b);
  }
  return [fe(r, n + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class H {
  constructor({ strings: e, _$litType$: t }, s) {
    let i;
    this.parts = [];
    let n = 0, o = 0;
    const l = e.length - 1, a = this.parts, [d, h] = ze(e, t);
    if (this.el = H.createElement(d, s), x.currentNode = this.el.content, t === 2 || t === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (i = x.nextNode()) !== null && a.length < l; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const c of i.getAttributeNames()) if (c.endsWith(pe)) {
          const f = h[o++], b = i.getAttribute(c).split($), D = /([.?@])?(.*)/.exec(f);
          a.push({ type: 1, index: n, name: D[2], strings: b, ctor: D[1] === "." ? He : D[1] === "?" ? Te : D[1] === "@" ? Ue : L }), i.removeAttribute(c);
        } else c.startsWith($) && (a.push({ type: 6, index: n }), i.removeAttribute(c));
        if (ge.test(i.tagName)) {
          const c = i.textContent.split($), f = c.length - 1;
          if (f > 0) {
            i.textContent = N ? N.emptyScript : "";
            for (let b = 0; b < f; b++) i.append(c[b], z()), x.nextNode(), a.push({ type: 2, index: ++n });
            i.append(c[f], z());
          }
        }
      } else if (i.nodeType === 8) if (i.data === ue) a.push({ type: 2, index: n });
      else {
        let c = -1;
        for (; (c = i.data.indexOf($, c + 1)) !== -1; ) a.push({ type: 7, index: n }), c += $.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const s = A.createElement("template");
    return s.innerHTML = e, s;
  }
}
function S(r, e, t = r, s) {
  var o, l;
  if (e === w) return e;
  let i = s !== void 0 ? (o = t._$Co) == null ? void 0 : o[s] : t._$Cl;
  const n = O(e) ? void 0 : e._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== n && ((l = i == null ? void 0 : i._$AO) == null || l.call(i, !1), n === void 0 ? i = void 0 : (i = new n(r), i._$AT(r, t, s)), s !== void 0 ? (t._$Co ?? (t._$Co = []))[s] = i : t._$Cl = i), i !== void 0 && (e = S(r, i._$AS(r, e.values), i, s)), e;
}
class Oe {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, i = ((e == null ? void 0 : e.creationScope) ?? A).importNode(t, !0);
    x.currentNode = i;
    let n = x.nextNode(), o = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let d;
        a.type === 2 ? d = new U(n, n.nextSibling, this, e) : a.type === 1 ? d = new a.ctor(n, a.name, a.strings, this, e) : a.type === 6 && (d = new De(n, this, e)), this._$AV.push(d), a = s[++l];
      }
      o !== (a == null ? void 0 : a.index) && (n = x.nextNode(), o++);
    }
    return x.currentNode = A, i;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class U {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, s, i) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = i, this._$Cv = (i == null ? void 0 : i.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = S(this, e, t), O(e) ? e === u || e == null || e === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : e !== this._$AH && e !== w && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ce(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== u && O(this._$AH) ? this._$AA.nextSibling.data = e : this.T(A.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var n;
    const { values: t, _$litType$: s } = e, i = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = H.createElement(fe(s.h, s.h[0]), this.options)), s);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === i) this._$AH.p(t);
    else {
      const o = new Oe(i, this), l = o.u(this.options);
      o.p(t), this.T(l), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = le.get(e.strings);
    return t === void 0 && le.set(e.strings, t = new H(e)), t;
  }
  k(e) {
    K(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, i = 0;
    for (const n of e) i === t.length ? t.push(s = new U(this.O(z()), this.O(z()), this, this.options)) : s = t[i], s._$AI(n), i++;
    i < t.length && (this._$AR(s && s._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, t); e !== this._$AB; ) {
      const i = se(e).nextSibling;
      se(e).remove(), e = i;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class L {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, i, n) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = u;
  }
  _$AI(e, t = this, s, i) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) e = S(this, e, t, 0), o = !O(e) || e !== this._$AH && e !== w, o && (this._$AH = e);
    else {
      const l = e;
      let a, d;
      for (e = n[0], a = 0; a < n.length - 1; a++) d = S(this, l[s + a], t, a), d === w && (d = this._$AH[a]), o || (o = !O(d) || d !== this._$AH[a]), d === u ? e = u : e !== u && (e += (d ?? "") + n[a + 1]), this._$AH[a] = d;
    }
    o && !i && this.j(e);
  }
  j(e) {
    e === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class He extends L {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === u ? void 0 : e;
  }
}
class Te extends L {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== u);
  }
}
class Ue extends L {
  constructor(e, t, s, i, n) {
    super(e, t, s, i, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = S(this, e, t, 0) ?? u) === w) return;
    const s = this._$AH, i = e === u && s !== u || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, n = e !== u && (s === u || i);
    i && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class De {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    S(this, e);
  }
}
const R = P.litHtmlPolyfillSupport;
R == null || R(H, U), (P.litHtmlVersions ?? (P.litHtmlVersions = [])).push("3.3.3");
const Me = (r, e, t) => {
  const s = (t == null ? void 0 : t.renderBefore) ?? e;
  let i = s._$litPart$;
  if (i === void 0) {
    const n = (t == null ? void 0 : t.renderBefore) ?? null;
    s._$litPart$ = i = new U(e.insertBefore(z(), n), n, void 0, t ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _ = globalThis;
class m extends E {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Me(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return w;
  }
}
var de;
m._$litElement$ = !0, m.finalized = !0, (de = _.litElementHydrateSupport) == null || de.call(_, { LitElement: m });
const j = _.litElementPolyfillSupport;
j == null || j({ LitElement: m });
(_.litElementVersions ?? (_.litElementVersions = [])).push("4.2.2");
class V extends m {
  constructor() {
    super(), this.espList = [], this.selectedEsp = null, this.searchQuery = "";
  }
  render() {
    const e = this.espList.filter(
      (t) => t.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || t.id.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    return p`
            <h3>ESP-controllers</h3>

     <div class="search-container">
    <input
        class="search-input"
        type="search"
        placeholder="Zoek ESP-controller..."
        .value=${this.searchQuery}
        @input=${(t) => this.searchQuery = t.target.value}
    >

    <button
        class="add-button"
        @click=${this.addController}
    >
        + Add controller
    </button>
</div>

            <div class="esp-list">
                ${e.map((t) => p`
                    <button
                        class="esp-card ${this.selectedEsp === t.id ? "selected" : ""}"
                        @click=${() => this.selectEsp(t.id)}
                    >
                        <div class="esp-name">${t.name}</div>
                        <div class="esp-id">${t.id}</div>
                    </button>
                `)}

                ${e.length === 0 ? p`
                    <p>Geen ESP-controllers gevonden.</p>
                ` : ""}
            </div>
        `;
  }
  selectEsp(e) {
    this.selectedEsp = e, this.dispatchEvent(new CustomEvent("esp-selected", {
      detail: { espId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  addController() {
    this.dispatchEvent(new CustomEvent("add-controller", {
      bubbles: !0,
      composed: !0
    }));
  }
}
g(V, "properties", {
  espList: { type: Array },
  selectedEsp: { type: String },
  searchQuery: { type: String }
}), g(V, "styles", T`
 :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

        h3 {
            margin: 0 0 16px;
            font-size: 18px;
            font-weight: 500;
        }

.esp-list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;

    padding-right: 6px;
    scrollbar-width: thin;
    scrollbar-color: #555b66 transparent;
}

        .esp-card {
            width: 100%;
            box-sizing: border-box;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #30343d;
            background: #292d35;
            color: #e1e1e1;
            text-align: left;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            flex-shrink: 0;
        }

        .esp-card:hover {
            background: #343943;
        }

        .esp-card.selected {
            background: #343e4b;
            border-color: #03a9f4;
        }

        .esp-name {
            font-size: 15px;
            font-weight: 500;
        }

        .esp-id {
            margin-top: 5px;
            color: #9da5b0;
            font-size: 12px;
        }
            .search-input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 14px;
    margin-bottom: 12px;

    border: 1px solid #3a3f48;
    border-radius: 9px;

    background: #292d35;
    color: #e1e1e1;
    font: inherit;
    outline: none;
}

.search-input:focus {
    border-color: #03a9f4;
}

.search-input::placeholder {
    color: #9299a4;
}

.search-container {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.search-input {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
}

.add-button {
    padding: 0 14px;
    border: 1px solid #3a3f48;
    border-radius: 9px;
    background: #343e4b;
    color: #e1e1e1;
    cursor: pointer;
    white-space: nowrap;
}

.add-button:hover {
    background: #405064;
}
    `);
customElements.define("esp-list", V);
class G extends m {
  constructor() {
    super(), this.fragrances = [], this.selectedFragrance = null, this.espName = "";
  }
  render() {
    return p`\

      
            <h3>Geuren</h3>

            <input
                class="esp-name-input"
                type="text"
                .value=${this.espName}
                @change=${(e) => this.changeEspName(e.target.value)}
            >

            

            <div class="fragrance-list">
                ${this.fragrances.map((e) => p`
                    <button
                        class="fragrance-card ${this.selectedFragrance === e.id ? "selected" : ""}"
                        @click=${() => this.selectFragrance(e.id)}
                    >
                        <div class="fragrance-name">
                            ${e.name}
                        </div>

                        <div class="fragrance-status">
                            ${e.enabled ? "Ingeschakeld" : "Uitgeschakeld"}
                        </div>
                    </button>
                `)}

                ${this.fragrances.length === 0 ? p`<p>Deze controller heeft nog geen geuren.</p>` : ""}
            </div>
        `;
  }
  changeEspName(e) {
    this.dispatchEvent(new CustomEvent("esp-name-changed", {
      detail: { name: e },
      bubbles: !0,
      composed: !0
    }));
  }
  selectFragrance(e) {
    this.dispatchEvent(new CustomEvent("fragrance-selected", {
      detail: { fragranceId: e },
      bubbles: !0,
      composed: !0
    }));
  }
}
g(G, "properties", {
  fragrances: { type: Array },
  selectedFragrance: { type: String },
  espName: { type: String }
}), g(G, "styles", T`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
        }

        h3 {
            margin: 0 0 12px;
            font-size: 18px;
            font-weight: 700;
        }

        .esp-name-input {
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 20px;
            padding: 11px 12px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #292d35;
            color: #e1e1e1;
            font-size: 17px;
            font-weight: 600;
            font-family: inherit;
        }

        .fragrance-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding-right: 6px;
            scrollbar-width: thin;
            scrollbar-color: #555b66 transparent;
        }

        .fragrance-card {
            width: 100%;
            box-sizing: border-box;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #30343d;
            background: #292d35;
            color: #e1e1e1;
            text-align: left;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s;
            flex-shrink: 0;
        }

        .fragrance-card:hover {
            background: #343943;
        }

        .fragrance-card.selected {
            background: #343e4b;
            border-color: #03a9f4;
        }

        .fragrance-name {
            font-size: 15px;
            font-weight: 500;
        }

        .fragrance-status {
            margin-top: 5px;
            font-size: 12px;
            color: #9da5b0;
        }
    `);
customElements.define("device-list", G);
class W extends m {
  constructor() {
    super(), this.fragrance = null;
  }
  render() {
    if (!this.fragrance)
      return p`
                <h3>Geurinstellingen</h3>
                <p class="empty">Selecteer eerst een geur.</p>
            `;
    const e = this.fragrance, t = Math.max(
      0,
      Math.min(100, e.stockLevel ?? 0)
    ), s = `hsl(${t * 1.2}, 85%, 45%)`, i = Math.max(
      0,
      (e.maxSprays ?? 0) - (e.sprayCount ?? 0)
    );
    return p`
            <h3>Geurinstellingen</h3>

            <input
                class="name-input"
                type="text"
                .value=${e.name ?? ""}
                @change=${(n) => this.updateFragrance({
      name: n.target.value
    })}
            >

            <div class="setting">
                <div class="setting-row">
                    <span>Geur ingeschakeld</span>
                    <input
                        type="checkbox"
                        .checked=${e.enabled}
                        @change=${(n) => this.updateFragrance({
      enabled: n.target.checked
    })}
                    >
                </div>
            </div>

            <div class="setting">
                <div class="setting-title">Geschatte geurvoorraad</div>
                <div>${t}%</div>

                <div class="stock-bar">
                    <div
                        class="stock-fill"
                        style="width: ${t}%; background: ${s}"
                    ></div>
                </div>

                <p>Geschat aantal resterende sprays: ${i}</p>
            </div>

            <div class="setting">
                <div class="setting-title">Spraystatus</div>

                <div class="setting-row">
                    <span>Genoeg geur om te sprayen</span>
                    <span class="${e.enoughFragrance ? "enough-yes" : "enough-no"}">
                    ${e.enoughFragrance ? "Ja" : "Nee"}
</span>
                </div>

                <p>Sprays sinds bijvullen: ${e.sprayCount ?? 0}</p>
            </div>

            <button
                class="manual-spray-button"
                ?disabled=${!e.enabled || !e.enoughFragrance}
                @click=${this.manualSpray}
            >
                Handmatig sprayen
            </button>
        `;
  }
  updateFragrance(e) {
    const t = {
      ...this.fragrance,
      ...e
    };
    this.dispatchEvent(new CustomEvent(
      "fragrance-settings-changed",
      {
        detail: { fragrance: t },
        bubbles: !0,
        composed: !0
      }
    ));
  }
  manualSpray() {
    this.dispatchEvent(new CustomEvent("manual-spray", {
      detail: {
        fragranceId: this.fragrance.id
      },
      bubbles: !0,
      composed: !0
    }));
  }
}
g(W, "properties", {
  fragrance: { type: Object }
}), g(W, "styles", T`
            :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            color: var(--primary-text-color);
        }

        h3 {
            margin: 0 0 16px;
            font-size: 18px;
            font-weight: 700;
        }

        .name-input {
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 20px;
            padding: 11px 12px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #292d35;
            color: #e1e1e1;
            font-size: 17px;
            font-family: inherit;
        }

        .setting {
            margin-bottom: 22px;
        }

        .setting-title {
            margin-bottom: 8px;
            font-weight: 700;
        }

        .setting-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .stock-bar {
            height: 9px;
            margin-top: 10px;
            overflow: hidden;
            border-radius: 6px;
            background: #3a3f48;
        }

            .stock-fill {
                height: 100%;
                transition: width 0.2s, background 0.2s;
            }

            .enough-yes {
                color: #4caf50;
                font-weight: 700;
            }

            .enough-no {
                color: #f44336;
                font-weight: 700;
            }
        .manual-spray-button {
            width: 100%;
            margin-top: 12px;
            padding: 11px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #343e4b;
            color: #e1e1e1;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        }

        .manual-spray-button:hover {
            background: #405064;
        }

        .manual-spray-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #03a9f4;
        }

        .empty {
            color: #9da5b0;
        }
    `);
customElements.define("fragrance-editor", W);
class q extends m {
  constructor() {
    super(), this.fragrances = [], this.schedule = [], this.editingId = null, this.formFragrance = "", this.formTime = "09:00", this.formAmount = 1, this.formDays = [], this.selectedDay = "Maandag", this.timelineHeight = 0, this.resizeObserver = null, this.observedEvents = null;
  }
  updated() {
    const e = this.renderRoot.querySelector(".events");
    e && (this.resizeObserver || (this.resizeObserver = new ResizeObserver((t) => {
      const s = t[0].contentRect.height;
      Math.abs(s - this.timelineHeight) > 0.5 && (this.timelineHeight = s, this.requestUpdate());
    })), this.observedEvents !== e && (this.resizeObserver.disconnect(), this.resizeObserver.observe(e), this.observedEvents = e));
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this.resizeObserver) == null || e.disconnect(), this.observedEvents = null;
  }
  get positionedSchedule() {
    const s = this.groupedSchedule.map((n) => ({
      ...n,
      top: this.timeToMinutes(n.time) / 1440 * this.timelineHeight
    })), i = [];
    for (const n of s) {
      const o = i[i.length - 1];
      !o || n.top >= o.bottom ? i.push({
        groups: [n],
        bottom: n.top + 28 + 5
      }) : (o.groups.push(n), o.bottom = Math.max(
        o.bottom,
        n.top + 28 + 5
      ));
    }
    return i.flatMap((n) => {
      const o = [], l = n.groups.map((d) => {
        let h = o.findIndex((c) => c <= d.top);
        return h === -1 && (h = o.length), o[h] = d.top + 28 + 5, {
          ...d,
          lane: h
        };
      }), a = o.length;
      return l.map((d) => ({
        ...d,
        left: d.lane / a * 100,
        width: 100 / a
      }));
    });
  }
  get days() {
    return [
      "Maandag",
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrijdag",
      "Zaterdag",
      "Zondag"
    ];
  }
  get groupedSchedule() {
    const e = {}, t = this.schedule.filter(
      (s) => (s.days ?? this.days).includes(this.selectedDay)
    );
    for (const s of t)
      e[s.time] || (e[s.time] = []), e[s.time].push(s);
    return Object.entries(e).sort(([s], [i]) => s.localeCompare(i)).map(([s, i]) => ({ time: s, items: i }));
  }
  get fragranceColors() {
    return [
      "#2878b5",
      "#26845c",
      "#a66b22",
      "#8755b5",
      "#bd4d62",
      "#238c91",
      "#777d35",
      "#b15e35"
    ];
  }
  getFragranceColor(e) {
    const t = [...String(e)].reduce(
      (s, i) => s + i.charCodeAt(0),
      0
    );
    return this.fragranceColors[t % this.fragranceColors.length];
  }
  render() {
    return p`
            <h3>Sprayplanning</h3>

            <button class="add-button" @click=${this.openAddPopup}>
                + Spraymoment toevoegen
            </button>

            <div class="day-filter">
                ${this.days.map((e) => p`
                    <button
                        class="${this.selectedDay === e ? "selected" : ""}"
                        @click=${() => this.selectedDay = e}
                    >
                        ${e.substring(0, 2)}
                    </button>
                `)}
            </div>

            <div class="timeline">
                <div class="timeline-content">

                    <div class="hours">
                        ${Array.from({ length: 24 }, (e, t) => p`
                            <div class="hour">
                                <div class="hour-label">
                                    ${String(t).padStart(2, "0")}:00
                                </div>
                                <div class="hour-line"></div>
                            </div>
                        `)}
                    </div>

                    <div class="events">
                        ${this.positionedSchedule.map((e) => p`
                         <div
                                    class="event-group"
                                    style="
                                        top: ${e.top}px;
                                        left: ${e.left}%;
                                        width: ${e.width}%;
                                    "
                                >
                                ${e.items.map((t) => {
      const s = this.fragrances.find(
        (n) => n.id === t.fragranceId
      ), i = this.getFragranceColor(
        t.fragranceId
      );
      return p`
                                        <button
                                            class="event"
                                            style="background: ${i}; border-color: ${i}"
                                            @click=${() => this.openEditPopup(t)}
                                        >
                                            ${(s == null ? void 0 : s.name) ?? "Onbekende geur"}
                                            · ${t.amountOfSprays ?? 1}x
                                        </button>
                                    `;
    })}
                            </div>
                        `)}
                    </div>
                </div>
            </div>

            ${this.groupedSchedule.length === 0 ? p`<p class="empty">Geen sprays gepland voor ${this.selectedDay.toLowerCase()}.</p>` : ""}

            ${this.editingId !== null ? this.renderPopup() : ""}
        `;
  }
  renderPopup() {
    const e = this.editingId !== "new";
    return p`
            <div class="overlay" @click=${this.closePopup}>
                <div class="popup" @click=${(t) => t.stopPropagation()}>
                    <h3>
                        ${e ? "Spraymoment bewerken" : "Spraymoment toevoegen"}
                    </h3>

                    <div class="field">
                        <label>Geur</label>
                        <select
                            .value=${this.formFragrance}
                            @change=${(t) => this.formFragrance = t.target.value}
                        >
                            ${this.fragrances.map((t) => p`
                                <option value=${t.id}>
                                    ${t.name}
                                </option>
                            `)}
                        </select>
                    </div>

                    <div class="field">
                        <label>Tijdstip</label>
                        <input
                            type="time"
                            .value=${this.formTime}
                            @change=${(t) => this.formTime = t.target.value}
                        >
                    </div>

                    <div class="field">
                        <label>Aantal sprays</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            .value=${String(this.formAmount)}
                            @input=${(t) => this.formAmount = Number(t.target.value)}
                        >
                    </div>

                    <div class="field">
                        <label>Dagen</label>
                        <div class="days">
                            ${this.days.map((t) => p`
                                <label class="day">
                                    <input
                                        type="checkbox"
                                        .checked=${this.formDays.includes(t)}
                                        @change=${(s) => this.toggleDay(
      t,
      s.target.checked
    )}
                                    >
                                    ${t.substring(0, 2)}
                                </label>
                            `)}
                        </div>
                    </div>

                    <div class="popup-actions">
                        <button
                            class="action-button"
                            @click=${this.closePopup}
                        >
                            Annuleren
                        </button>

                        ${e ? p`
                            <button
                                class="action-button delete-button"
                                @click=${this.deleteSchedule}
                            >
                                Verwijderen
                            </button>
                        ` : ""}

                        <button
                            class="action-button"
                            @click=${this.saveSchedule}
                        >
                            ${e ? "Opslaan" : "Toevoegen"}
                        </button>
                    </div>
                </div>
            </div>
        `;
  }
  timeToMinutes(e) {
    const [t, s] = e.split(":").map(Number);
    return t * 60 + s;
  }
  openAddPopup() {
    this.fragrances.length !== 0 && (this.editingId = "new", this.formFragrance = this.fragrances[0].id, this.formTime = "09:00", this.formAmount = 1, this.formDays = [...this.days]);
  }
  openEditPopup(e) {
    this.editingId = e.id, this.formFragrance = e.fragranceId, this.formTime = e.time, this.formAmount = e.amountOfSprays ?? 1, this.formDays = [...e.days ?? this.days];
  }
  closePopup() {
    this.editingId = null;
  }
  toggleDay(e, t) {
    this.formDays = t ? [...this.formDays, e] : this.formDays.filter((s) => s !== e);
  }
  saveSchedule() {
    const e = /^([01]\d|2[0-3]):[0-5]\d$/.test(this.formTime);
    if (!this.formFragrance || !e || this.formDays.length === 0 || !Number.isInteger(this.formAmount) || this.formAmount < 1 || this.formAmount > 100)
      return;
    const t = {
      id: this.editingId === "new" ? crypto.randomUUID() : this.editingId,
      fragranceId: this.formFragrance,
      time: this.formTime,
      amountOfSprays: this.formAmount,
      days: [...this.formDays]
    }, s = this.editingId === "new" ? [...this.schedule, t] : this.schedule.map(
      (i) => i.id === t.id ? t : i
    );
    this.dispatchSchedule(s), this.closePopup();
  }
  deleteSchedule() {
    const e = this.schedule.filter(
      (t) => t.id !== this.editingId
    );
    this.dispatchSchedule(e), this.closePopup();
  }
  dispatchSchedule(e) {
    this.dispatchEvent(new CustomEvent("schedule-changed", {
      detail: { schedule: e },
      bubbles: !0,
      composed: !0
    }));
  }
}
g(q, "properties", {
  fragrances: { type: Array },
  schedule: { type: Array },
  editingId: { type: String },
  formFragrance: { type: String },
  formTime: { type: String },
  formAmount: { type: Number },
  formDays: { type: Array },
  selectedDay: { type: String }
}), g(q, "styles", T`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
            overflow: hidden;
            color: var(--primary-text-color);
        }

        h3 {
            margin: 0 0 12px;
            font-size: 18px;
            font-weight: 700;
        }

        .add-button, .action-button {
            width: 100%;
            padding: 10px;
            border: 1px solid #3a3f48;
            border-radius: 9px;
            background: #343e4b;
            color: #e1e1e1;
            cursor: pointer;
            font-size: 13px;
        }

        .add-button:hover, .action-button:hover {
            background: #405064;
        }

        .day-filter {
            display: flex;
            gap: 4px;
            margin-top: 12px;
            margin-bottom: 8px;
        }

        .day-filter button {
            flex: 1;
            min-width: 0;
            padding: 7px 2px;
            border: 1px solid #3a3f48;
            border-radius: 6px;
            background: #292d35;
            color: #aeb6c2;
            font-size: 11px;
            cursor: pointer;
        }

        .day-filter button.selected {
            background: #344b60;
            border-color: #2196f3;
            color: white;
        }

        .timeline {
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }

        .timeline-content {
            position: relative;
            height: 100%;
            min-height: 0;
        }

        .hours {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-rows: repeat(24, minmax(0, 1fr));
        }

        .hour {
            display: grid;
            grid-template-columns: 55px 1fr;
            min-height: 0;
        }

        .hour-label {
            color: #aeb6c2;
            font-size: 11px;
            font-weight: 600;
            padding: 2px 0 0 3px;
        }

        .hour-line {
            border-top: 1px solid #59616e;
            margin-top: 5px;
        }

        .events {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 55px;
            right: 0;
            pointer-events: none;
        }

.event-group {
    position: absolute;
    display: flex;
    gap: 5px;
    pointer-events: auto;
    box-sizing: border-box;
}

        .event {
            flex: 1;
            min-width: 0;
            height: 28px;
            box-sizing: border-box;
            padding: 3px 6px;
            border: 1px solid;
            border-radius: 6px;
            color: white;
            text-align: left;
            cursor: pointer;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-size: 11px;
            font-weight: 600;
        }
        .event:hover {
            filter: brightness(1.15);
        }

        .empty {
            color: var(--secondary-text-color);
            font-size: 12px;
        }

        .overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.65);
        }

        .popup {
            width: 100%;
            max-width: 400px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 22px;
            border: 1px solid var(--divider-color);
            border-radius: 12px;
            background: var(--card-background-color);
            box-sizing: border-box;
        }

        .popup {
            background: #202630;
            border: 1px solid #505b6b;
            border-radius: 10px;
        }

        .field {
            margin-bottom: 18px;
        }

        .field label {
            display: block;
            margin-bottom: 7px;
            font-size: 13px;
            font-weight: 600;
        }

        .field select,
        .field input[type="time"],
        .field input[type="number"] {
            width: 100%;
            box-sizing: border-box;
            padding: 11px;
            border: 1px solid #505b6b;
            border-radius: 5px;
            background-color: #343e4b;
            color: #ffffff;
            opacity: 1;
            font: inherit;
            color-scheme: dark;
        }

        .days {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        .day {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
        }

        .day input {
            accent-color: #2196f3;
        }

        .popup-actions {
            display: flex;
            gap: 8px;
            margin-top: 20px;
        }

        .popup-actions button {
            flex: 1;
        }

        .delete-button {
            background: #b83232;
            border-color: transparent;
        }
    `);
customElements.define("schedule-editor", q);
class Q extends m {
  constructor() {
    super(), this.espList = [
      {
        id: "esp1",
        name: "Woonkamer-controller",
        schedule: [],
        fragrances: [
          {
            id: "fragrance1",
            name: "Lavendel",
            enabled: !0,
            stockLevel: 80,
            maxSprays: 200,
            sprayCount: 124,
            enoughFragrance: !0
          },
          {
            id: "fragrance2",
            name: "Citrus",
            enabled: !0,
            stockLevel: 35,
            maxSprays: 200,
            sprayCount: 58,
            enoughFragrance: !0
          }
        ]
      },
      {
        id: "esp2",
        name: "Keuken-controller",
        schedule: [],
        fragrances: [
          {
            id: "fragrance3",
            name: "Vanille",
            enabled: !1,
            stockLevel: 10,
            maxSprays: 200,
            sprayCount: 210,
            enoughFragrance: !1
          }
        ]
      }
    ], this.selectedEsp = "esp1", this.selectedFragrance = "fragrance1";
  }
  get selectedEspData() {
    return this.espList.find(
      (e) => e.id === this.selectedEsp
    );
  }
  get selectedFragrances() {
    var e;
    return ((e = this.selectedEspData) == null ? void 0 : e.fragrances) ?? [];
  }
  get selectedFragranceData() {
    return this.selectedFragrances.find(
      (e) => e.id === this.selectedFragrance
    );
  }
  updateFragrance(e) {
    this.espList = this.espList.map((t) => t.id !== this.selectedEsp ? t : {
      ...t,
      fragrances: t.fragrances.map(
        (s) => s.id === e.id ? e : s
      )
    });
  }
  render() {
    var e, t;
    return p`
            <div class="layout">

                <div class="section">
                    <esp-list
                        .espList=${this.espList}
                        .selectedEsp=${this.selectedEsp}
                        @esp-selected=${(s) => {
      var n, o;
      this.selectedEsp = s.detail.espId;
      const i = ((n = this.espList.find(
        (l) => l.id === this.selectedEsp
      )) == null ? void 0 : n.fragrances) ?? [];
      this.selectedFragrance = ((o = i[0]) == null ? void 0 : o.id) ?? null;
    }}
                        @esp-name-changed=${(s) => {
      this.espList = this.espList.map(
        (i) => i.id === s.detail.espId ? { ...i, name: s.detail.name } : i
      );
    }}
                    ></esp-list>
                </div>

                <div class="section">
                    <device-list
                        .fragrances=${this.selectedFragrances}
                        .selectedFragrance=${this.selectedFragrance}
                        .espName=${((e = this.selectedEspData) == null ? void 0 : e.name) ?? ""}
                        @fragrance-selected=${(s) => {
      this.selectedFragrance = s.detail.fragranceId;
    }}
                        @esp-name-changed=${(s) => {
      this.espList = this.espList.map(
        (i) => i.id === this.selectedEsp ? { ...i, name: s.detail.name } : i
      );
    }}
                    ></device-list>
                </div>

                <div class="section">
                    <fragrance-editor
                        .fragrance=${this.selectedFragranceData}
                        @fragrance-settings-changed=${(s) => {
      this.updateFragrance(s.detail.fragrance);
    }}
                        @manual-spray=${(s) => {
      console.log(
        "Handmatig sprayen:",
        s.detail.fragranceId
      );
    }}
                    ></fragrance-editor>
                </div>

                <div class="section">
                    <schedule-editor
                        .fragrances=${this.selectedFragrances}
                        .schedule=${((t = this.selectedEspData) == null ? void 0 : t.schedule) ?? []}
                        @schedule-changed=${(s) => {
      this.espList = this.espList.map(
        (i) => i.id === this.selectedEsp ? { ...i, schedule: s.detail.schedule } : i
      );
    }}
                    ></schedule-editor>
                </div>

            </div>
        `;
  }
}
g(Q, "properties", {
  espList: { type: Array },
  selectedEsp: { type: String },
  selectedFragrance: { type: String }
}), g(Q, "styles", T`
        :host {
            display: block;
            min-height: 100vh;
            padding: 20px;
            box-sizing: border-box;
            background: #111318;
            color: #e1e1e1;
            font-family: Roboto, Arial, sans-serif;
        }

        .layout {
            display: grid;
            grid-template-columns: 0.67fr 0.67fr 0.67fr 1.5fr;
            gap: 16px;
        }

        .section {
            height: calc(100vh - 40px);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-height: 0;
        }

        @media (max-width: 800px) {
            .layout {
                grid-template-columns: 1fr;
            }

            .section {
                height: auto;
                min-height: 300px;
            }
        }
    `);
console.log("Tilo Controller component geladen!");
customElements.define("tilo-controller", Q);
