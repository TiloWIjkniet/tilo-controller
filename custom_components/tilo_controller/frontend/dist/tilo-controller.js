var me = Object.defineProperty;
var ve = (r, e, t) => e in r ? me(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var m = (r, e, t) => ve(r, typeof e != "symbol" ? e + "" : e, t);
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, Z = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, J = Symbol(), Q = /* @__PURE__ */ new WeakMap();
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
      s && (e = Q.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && Q.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ge = (r) => new ce(typeof r == "string" ? r : r + "", void 0, J), T = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce((s, i, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[o + 1], r[0]);
  return new ce(t, r, J);
}, fe = (r, e) => {
  if (Z) r.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), i = M.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = t.cssText, r.appendChild(s);
  }
}, X = Z ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return ge(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ye, defineProperty: be, getOwnPropertyDescriptor: _e, getOwnPropertyNames: Ae, getOwnPropertySymbols: Ee, getPrototypeOf: xe } = Object, f = globalThis, Y = f.trustedTypes, Se = Y ? Y.emptyScript : "", z = f.reactiveElementPolyfillSupport, k = (r, e) => r, W = { toAttribute(r, e) {
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
} }, le = (r, e) => !ye(r, e), ee = { attribute: !0, type: String, converter: W, reflect: !1, useDefault: !1, hasChanged: le };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), f.litPropertyMetadata ?? (f.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let x = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = ee) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(e, s, t);
      i !== void 0 && be(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: i, set: o } = _e(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: i, set(n) {
      const d = i == null ? void 0 : i.call(this);
      o == null || o.call(this, n), this.requestUpdate(e, d, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? ee;
  }
  static _$Ei() {
    if (this.hasOwnProperty(k("elementProperties"))) return;
    const e = xe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(k("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(k("properties"))) {
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
      for (const i of s) t.unshift(X(i));
    } else e !== void 0 && t.push(X(e));
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
    return fe(e, this.constructor.elementStyles), e;
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
    var o;
    const s = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, s);
    if (i !== void 0 && s.reflect === !0) {
      const n = (((o = s.converter) == null ? void 0 : o.toAttribute) !== void 0 ? s.converter : W).toAttribute(t, s.type);
      this._$Em = e, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var o, n;
    const s = this.constructor, i = s._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const d = s.getPropertyOptions(i), a = typeof d.converter == "function" ? { fromAttribute: d.converter } : ((o = d.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? d.converter : W;
      this._$Em = i;
      const l = a.fromAttribute(t, d.type);
      this[i] = l ?? ((n = this._$Ej) == null ? void 0 : n.get(i)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, i = !1, o) {
    var n;
    if (e !== void 0) {
      const d = this.constructor;
      if (i === !1 && (o = this[e]), s ?? (s = d.getPropertyOptions(e)), !((s.hasChanged ?? le)(o, t) || s.useDefault && s.reflect && o === ((n = this._$Ej) == null ? void 0 : n.get(e)) && !this.hasAttribute(d._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: i, wrapped: o }, n) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
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
        for (const [o, n] of this._$Ep) this[o] = n;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [o, n] of i) {
        const { wrapped: d } = n, a = this[o];
        d !== !0 || this._$AL.has(o) || a === void 0 || this.C(o, void 0, n, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (s = this._$EO) == null || s.forEach((i) => {
        var o;
        return (o = i.hostUpdate) == null ? void 0 : o.call(i);
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
x.elementStyles = [], x.shadowRootOptions = { mode: "open" }, x[k("elementProperties")] = /* @__PURE__ */ new Map(), x[k("finalized")] = /* @__PURE__ */ new Map(), z == null || z({ ReactiveElement: x }), (f.reactiveElementVersions ?? (f.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, te = (r) => r, R = N.trustedTypes, se = R ? R.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, he = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, pe = "?" + g, we = `<${pe}>`, E = document, P = () => E.createComment(""), D = (r) => r === null || typeof r != "object" && typeof r != "function", G = Array.isArray, Ce = (r) => G(r) || typeof (r == null ? void 0 : r[Symbol.iterator]) == "function", j = `[ 	
\f\r]`, C = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ie = /-->/g, re = />/g, b = RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ne = /'/g, oe = /"/g, ue = /^(?:script|style|textarea|title)$/i, ke = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), u = ke(1), S = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), ae = /* @__PURE__ */ new WeakMap(), _ = E.createTreeWalker(E, 129);
function $e(r, e) {
  if (!G(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return se !== void 0 ? se.createHTML(e) : e;
}
const Ne = (r, e) => {
  const t = r.length - 1, s = [];
  let i, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = C;
  for (let d = 0; d < t; d++) {
    const a = r[d];
    let l, p, c = -1, $ = 0;
    for (; $ < a.length && (n.lastIndex = $, p = n.exec(a), p !== null); ) $ = n.lastIndex, n === C ? p[1] === "!--" ? n = ie : p[1] !== void 0 ? n = re : p[2] !== void 0 ? (ue.test(p[2]) && (i = RegExp("</" + p[2], "g")), n = b) : p[3] !== void 0 && (n = b) : n === b ? p[0] === ">" ? (n = i ?? C, c = -1) : p[1] === void 0 ? c = -2 : (c = n.lastIndex - p[2].length, l = p[1], n = p[3] === void 0 ? b : p[3] === '"' ? oe : ne) : n === oe || n === ne ? n = b : n === ie || n === re ? n = C : (n = b, i = void 0);
    const v = n === b && r[d + 1].startsWith("/>") ? " " : "";
    o += n === C ? a + we : c >= 0 ? (s.push(l), a.slice(0, c) + he + a.slice(c) + g + v) : a + g + (c === -2 ? d : v);
  }
  return [$e(r, o + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class U {
  constructor({ strings: e, _$litType$: t }, s) {
    let i;
    this.parts = [];
    let o = 0, n = 0;
    const d = e.length - 1, a = this.parts, [l, p] = Ne(e, t);
    if (this.el = U.createElement(l, s), _.currentNode = this.el.content, t === 2 || t === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (i = _.nextNode()) !== null && a.length < d; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const c of i.getAttributeNames()) if (c.endsWith(he)) {
          const $ = p[n++], v = i.getAttribute(c).split(g), H = /([.?@])?(.*)/.exec($);
          a.push({ type: 1, index: o, name: H[2], strings: v, ctor: H[1] === "." ? De : H[1] === "?" ? Ue : H[1] === "@" ? Oe : L }), i.removeAttribute(c);
        } else c.startsWith(g) && (a.push({ type: 6, index: o }), i.removeAttribute(c));
        if (ue.test(i.tagName)) {
          const c = i.textContent.split(g), $ = c.length - 1;
          if ($ > 0) {
            i.textContent = R ? R.emptyScript : "";
            for (let v = 0; v < $; v++) i.append(c[v], P()), _.nextNode(), a.push({ type: 2, index: ++o });
            i.append(c[$], P());
          }
        }
      } else if (i.nodeType === 8) if (i.data === pe) a.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = i.data.indexOf(g, c + 1)) !== -1; ) a.push({ type: 7, index: o }), c += g.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const s = E.createElement("template");
    return s.innerHTML = e, s;
  }
}
function w(r, e, t = r, s) {
  var n, d;
  if (e === S) return e;
  let i = s !== void 0 ? (n = t._$Co) == null ? void 0 : n[s] : t._$Cl;
  const o = D(e) ? void 0 : e._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== o && ((d = i == null ? void 0 : i._$AO) == null || d.call(i, !1), o === void 0 ? i = void 0 : (i = new o(r), i._$AT(r, t, s)), s !== void 0 ? (t._$Co ?? (t._$Co = []))[s] = i : t._$Cl = i), i !== void 0 && (e = w(r, i._$AS(r, e.values), i, s)), e;
}
class Pe {
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
    const { el: { content: t }, parts: s } = this._$AD, i = ((e == null ? void 0 : e.creationScope) ?? E).importNode(t, !0);
    _.currentNode = i;
    let o = _.nextNode(), n = 0, d = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let l;
        a.type === 2 ? l = new O(o, o.nextSibling, this, e) : a.type === 1 ? l = new a.ctor(o, a.name, a.strings, this, e) : a.type === 6 && (l = new He(o, this, e)), this._$AV.push(l), a = s[++d];
      }
      n !== (a == null ? void 0 : a.index) && (o = _.nextNode(), n++);
    }
    return _.currentNode = E, i;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class O {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, s, i) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = i, this._$Cv = (i == null ? void 0 : i.isConnected) ?? !0;
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
    e = w(this, e, t), D(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== S && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ce(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && D(this._$AH) ? this._$AA.nextSibling.data = e : this.T(E.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var o;
    const { values: t, _$litType$: s } = e, i = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = U.createElement($e(s.h, s.h[0]), this.options)), s);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === i) this._$AH.p(t);
    else {
      const n = new Pe(i, this), d = n.u(this.options);
      n.p(t), this.T(d), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = ae.get(e.strings);
    return t === void 0 && ae.set(e.strings, t = new U(e)), t;
  }
  k(e) {
    G(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, i = 0;
    for (const o of e) i === t.length ? t.push(s = new O(this.O(P()), this.O(P()), this, this.options)) : s = t[i], s._$AI(o), i++;
    i < t.length && (this._$AR(s && s._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, t); e !== this._$AB; ) {
      const i = te(e).nextSibling;
      te(e).remove(), e = i;
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
  constructor(e, t, s, i, o) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = h;
  }
  _$AI(e, t = this, s, i) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = w(this, e, t, 0), n = !D(e) || e !== this._$AH && e !== S, n && (this._$AH = e);
    else {
      const d = e;
      let a, l;
      for (e = o[0], a = 0; a < o.length - 1; a++) l = w(this, d[s + a], t, a), l === S && (l = this._$AH[a]), n || (n = !D(l) || l !== this._$AH[a]), l === h ? e = h : e !== h && (e += (l ?? "") + o[a + 1]), this._$AH[a] = l;
    }
    n && !i && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class De extends L {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class Ue extends L {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class Oe extends L {
  constructor(e, t, s, i, o) {
    super(e, t, s, i, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = w(this, e, t, 0) ?? h) === S) return;
    const s = this._$AH, i = e === h && s !== h || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, o = e !== h && (s === h || i);
    i && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class He {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    w(this, e);
  }
}
const I = N.litHtmlPolyfillSupport;
I == null || I(U, O), (N.litHtmlVersions ?? (N.litHtmlVersions = [])).push("3.3.3");
const Me = (r, e, t) => {
  const s = (t == null ? void 0 : t.renderBefore) ?? e;
  let i = s._$litPart$;
  if (i === void 0) {
    const o = (t == null ? void 0 : t.renderBefore) ?? null;
    s._$litPart$ = i = new O(e.insertBefore(P(), o), o, void 0, t ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const A = globalThis;
class y extends x {
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
    return S;
  }
}
var de;
y._$litElement$ = !0, y.finalized = !0, (de = A.litElementHydrateSupport) == null || de.call(A, { LitElement: y });
const B = A.litElementPolyfillSupport;
B == null || B({ LitElement: y });
(A.litElementVersions ?? (A.litElementVersions = [])).push("4.2.2");
class q extends y {
  constructor() {
    super(), this.espList = [], this.selectedEsp = null, this.editingEsp = null, this.editName = "";
  }
  render() {
    return u`
            <h3>ESP Controllers</h3>

            ${this.espList.map((e) => u`
                <div>
                    <button
                        class="esp-button ${this.selectedEsp === e.id ? "selected" : ""}"
                        @click="${() => this.selectEsp(e.id)}"
                    >
                        ${e.name}
                    </button>

                    ${this.editingEsp === e.id ? u`
                        <div class="edit-container">
                            <input
                                .value="${this.editName}"
                                @input="${(t) => this.editName = t.target.value}"
                                @keydown="${(t) => {
      t.key === "Enter" && this.saveName(e.id);
    }}"
                            >

                            <button
                                class="edit-button"
                                @click="${() => this.saveName(e.id)}"
                            >
                                Opslaan
                            </button>
                        </div>
                    ` : u`
                        <button
                            class="edit-button"
                            @click="${() => this.startEditing(e)}"
                        >
                            Naam wijzigen
                        </button>
                    `}
                </div>
            `)}
        `;
  }
  selectEsp(e) {
    this.selectedEsp = e, this.dispatchEvent(new CustomEvent("esp-selected", {
      detail: { espId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  startEditing(e) {
    this.editingEsp = e.id, this.editName = e.name;
  }
  saveName(e) {
    const t = this.editName.trim();
    t && (this.espList = this.espList.map(
      (s) => s.id === e ? { ...s, name: t } : s
    ), this.editingEsp = null, this.dispatchEvent(new CustomEvent("esp-name-changed", {
      detail: {
        espId: e,
        name: t
      },
      bubbles: !0,
      composed: !0
    })));
  }
}
m(q, "properties", {
  espList: { type: Array },
  selectedEsp: { type: String },
  editingEsp: { type: String },
  editName: { type: String }
}), m(q, "styles", T`
        :host {
            display: block;
        }

        button, input {
            box-sizing: border-box;
            font: inherit;
        }

        .esp-button {
            display: block;
            width: 100%;
            padding: 12px;
            margin-bottom: 8px;
            border: none;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
        }

        .selected {
            background: var(--primary-color);
            color: white;
        }

        .edit-container {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
        }

        input {
            min-width: 0;
            flex: 1;
            padding: 8px;
            border-radius: 6px;
            border: 1px solid var(--divider-color);
            background: var(--card-background-color);
            color: var(--primary-text-color);
        }

        .edit-button {
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
    `);
customElements.define("esp-list", q);
class V extends y {
  constructor() {
    super(), this.devices = [], this.selectedDevice = null, this.editingDevice = null, this.editName = "";
  }
  render() {
    return u`
            <h3>Apparaten</h3>

            ${this.devices.map((e) => u`
                <div>
                    <button
                        class="device-button ${this.selectedDevice === e.id ? "selected" : ""}"
                        @click="${() => this.selectDevice(e.id)}"
                    >
                        ${e.name}
                    </button>

                    ${this.editingDevice === e.id ? u`
                        <div class="edit-container">
                            <input
                                .value="${this.editName}"
                                @input="${(t) => this.editName = t.target.value}"
                                @keydown="${(t) => {
      t.key === "Enter" && this.saveName(e.id);
    }}"
                            >

                            <button
                                class="edit-button"
                                @click="${() => this.saveName(e.id)}"
                            >
                                Opslaan
                            </button>
                        </div>
                    ` : u`
                        <button
                            class="edit-button"
                            @click="${() => this.startEditing(e)}"
                        >
                            Naam wijzigen
                        </button>
                    `}
                </div>
            `)}
        `;
  }
  selectDevice(e) {
    this.selectedDevice = e, this.dispatchEvent(new CustomEvent("device-selected", {
      detail: { deviceId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  startEditing(e) {
    this.editingDevice = e.id, this.editName = e.name;
  }
  saveName(e) {
    const t = this.editName.trim();
    t && (this.devices = this.devices.map(
      (s) => s.id === e ? { ...s, name: t } : s
    ), this.editingDevice = null, this.dispatchEvent(new CustomEvent("device-name-changed", {
      detail: {
        deviceId: e,
        name: t
      },
      bubbles: !0,
      composed: !0
    })));
  }
}
m(V, "properties", {
  devices: { type: Array },
  selectedDevice: { type: String },
  editingDevice: { type: String },
  editName: { type: String }
}), m(V, "styles", T`
        :host {
            display: block;
        }

        button, input {
            box-sizing: border-box;
            font: inherit;
        }

        .device-button {
            display: block;
            width: 100%;
            padding: 12px;
            margin-bottom: 8px;
            border: none;
            border-radius: 8px;
            text-align: left;
            cursor: pointer;
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
        }

        .selected {
            background: var(--primary-color);
            color: white;
        }

        .edit-container {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
        }

        input {
            min-width: 0;
            flex: 1;
            padding: 8px;
            border-radius: 6px;
            border: 1px solid var(--divider-color);
            background: var(--card-background-color);
            color: var(--primary-text-color);
        }

        .edit-button {
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
    `);
customElements.define("device-list", V);
class K extends y {
  constructor() {
    super(), this.devices = [], this.fragrances = [], this.schedule = [], this.selectedDevice = "";
  }
  render() {
    return u`
            <h3>Planning</h3>

            ${this.schedule.filter(
      (e) => !this.selectedDevice || e.deviceId === this.selectedDevice
    ).sort((e, t) => e.time.localeCompare(t.time)).map((e) => u`
                    <div class="event">
                        <div>
                            <strong>${e.time}</strong>
                            <div>${this.getDeviceName(e.deviceId)}</div>
                            <div>${this.getFragranceName(e.fragranceId)}</div>
                        </div>

                        <button
                            class="remove-button"
                            @click="${() => this.removeEvent(e.id)}"
                        >
                            Verwijderen
                        </button>
                    </div>
                `)}

            <div class="form">
                <h4>Spraymoment toevoegen</h4>

                <input
                    type="time"
                    id="event-time"
                >

                <select id="event-device">
                    ${this.devices.map((e) => u`
                        <option value="${e.id}">
                            ${e.name}
                        </option>
                    `)}
                </select>

                <select id="event-fragrance">
                    ${this.fragrances.map((e) => u`
                        <option value="${e.id}">
                            ${e.name}
                        </option>
                    `)}
                </select>

                <button
                    class="add-button"
                    @click="${this.addEvent}"
                >
                    Spraymoment toevoegen
                </button>
            </div>
        `;
  }
  getDeviceName(e) {
    var t;
    return ((t = this.devices.find((s) => s.id === e)) == null ? void 0 : t.name) ?? "Onbekend apparaat";
  }
  getFragranceName(e) {
    var t;
    return ((t = this.fragrances.find((s) => s.id === e)) == null ? void 0 : t.name) ?? "Onbekende geur";
  }
  addEvent() {
    const e = this.renderRoot.querySelector("#event-time").value, t = this.renderRoot.querySelector("#event-device").value, s = this.renderRoot.querySelector("#event-fragrance").value;
    if (!e || !t || !s) return;
    const i = {
      id: crypto.randomUUID(),
      time: e,
      deviceId: t,
      fragranceId: s
    };
    this.schedule = [...this.schedule, i], this.dispatchEvent(new CustomEvent("schedule-changed", {
      detail: { schedule: this.schedule },
      bubbles: !0,
      composed: !0
    }));
  }
  removeEvent(e) {
    this.schedule = this.schedule.filter((t) => t.id !== e), this.dispatchEvent(new CustomEvent("schedule-changed", {
      detail: { schedule: this.schedule },
      bubbles: !0,
      composed: !0
    }));
  }
}
m(K, "properties", {
  devices: { type: Array },
  fragrances: { type: Array },
  schedule: { type: Array },
  selectedDevice: { type: String }
}), m(K, "styles", T`
        :host {
            display: block;
        }

        .event {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 8px;
            background: var(--secondary-background-color);
        }

        .form {
            display: grid;
            gap: 10px;
            margin-top: 16px;
        }

        input, select, button {
            box-sizing: border-box;
            padding: 10px;
            border-radius: 6px;
            font: inherit;
        }

        input, select {
            border: 1px solid var(--divider-color);
            background: var(--card-background-color);
            color: var(--primary-text-color);
        }

        button {
            cursor: pointer;
            border: none;
        }

        .add-button {
            background: var(--primary-color);
            color: white;
        }

        .remove-button {
            background: var(--error-color);
            color: white;
        }
    `);
customElements.define("schedule-editor", K);
class F extends y {
  constructor() {
    super(), this.espList = [
      { id: "esp1", name: "Woonkamer-controller" },
      { id: "esp2", name: "Keuken-controller" }
    ], this.devices = [
      { id: "device1", esp_id: "esp1", name: "Woonkamer" },
      { id: "device2", esp_id: "esp1", name: "Slaapkamer" },
      { id: "device3", esp_id: "esp2", name: "Keuken" }
    ], this.fragrances = [
      { id: "fragrance1", name: "Lavendel" },
      { id: "fragrance2", name: "Citrus" }
    ], this.schedules = {
      esp1: [],
      esp2: []
    }, this.selectedEsp = "esp1", this.selectedDevice = null;
  }
  get selectedDevices() {
    return this.devices.filter(
      (e) => e.esp_id === this.selectedEsp
    );
  }
  render() {
    return u`
            <h1>Tilo Controller</h1>

            <div class="layout">

                <div class="section">
                    <esp-list
                        .espList=${this.espList}
                        .selectedEsp=${this.selectedEsp}
                        @esp-selected=${(e) => {
      this.selectedEsp = e.detail.espId, this.selectedDevice = null;
    }}
                        @esp-name-changed=${(e) => {
      this.espList = this.espList.map(
        (t) => t.id === e.detail.espId ? { ...t, name: e.detail.name } : t
      );
    }}
                    ></esp-list>
                </div>

                <div class="section">
                    <device-list
                        .devices=${this.selectedDevices}
                        .selectedDevice=${this.selectedDevice}
                        @device-selected=${(e) => {
      this.selectedDevice = e.detail.deviceId;
    }}
                        @device-name-changed=${(e) => {
      this.devices = this.devices.map(
        (t) => t.id === e.detail.deviceId ? { ...t, name: e.detail.name } : t
      );
    }}
                    ></device-list>
                </div>

                <div class="section">
                    <schedule-editor
                        .devices=${this.selectedDevices}
                        .fragrances=${this.fragrances}
                        .schedule=${this.schedules[this.selectedEsp] ?? []}
                        .selectedDevice=${this.selectedDevice}
                        @schedule-changed=${(e) => {
      this.schedules = {
        ...this.schedules,
        [this.selectedEsp]: e.detail.schedule
      };
    }}
                    ></schedule-editor>
                </div>

            </div>
        `;
  }
}
m(F, "properties", {
  espList: { type: Array },
  devices: { type: Array },
  fragrances: { type: Array },
  schedules: { type: Object },
  selectedEsp: { type: String },
  selectedDevice: { type: String }
}), m(F, "styles", T`
        :host {
            display: block;
            padding: 20px;
            color: var(--primary-text-color);
        }

        .layout {
            display: grid;
            grid-template-columns: 1fr 1fr 2fr;
            gap: 20px;
        }

        .section {
            padding: 16px;
            border-radius: 12px;
            background: var(--card-background-color);
        }

        @media (max-width: 800px) {
            .layout {
                grid-template-columns: 1fr;
            }
        }
    `);
customElements.define("tilo-controller", F);
