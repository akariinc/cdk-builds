/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * DOM-based HTML sanitizer that preserves inline SVG.
 *
 * Angular's built-in sanitizer strips SVG elements, which is the reason this fork
 * exists. This implementation follows the same architecture as Angular's sanitizer
 * (parse into an inert document, walk the tree, keep only allowlisted elements and
 * attributes, validate URL-valued attributes) instead of regex rewriting, which is
 * bypassable (unquoted event handlers, unclosed tags, entity-encoded URLs, etc.).
 *
 * Intentionally NOT allowed: script, style, iframe, object, embed, form, meta,
 * link, base, template, math, foreignObject (mXSS vector), SMIL animation
 * elements (attribute-injection vector, e.g. `<animate attributeName="href">`).
 */
/** HTML elements that are safe to keep (same set Angular's sanitizer allows). */
const HTML_ELEMENTS = 'address,article,aside,blockquote,caption,center,del,details,dialog,dir,div,dl,dd,dt,' +
    'figure,figcaption,footer,h1,h2,h3,h4,h5,h6,header,hgroup,hr,ins,main,map,menu,nav,ol,' +
    'li,ul,pre,section,summary,table,tbody,td,tfoot,th,thead,tr,a,abbr,acronym,audio,b,bdi,' +
    'bdo,big,br,cite,code,em,font,i,img,kbd,label,mark,picture,q,rp,rt,ruby,s,samp,small,' +
    'source,span,strike,strong,sub,sup,time,track,tt,u,var,video';
/** SVG elements that are safe to keep. */
const SVG_ELEMENTS = 'svg,circle,clippath,defs,desc,ellipse,filter,feblend,fecolormatrix,fecomponenttransfer,' +
    'fecomposite,feconvolvematrix,fediffuselighting,fedisplacementmap,fedistantlight,' +
    'fedropshadow,feflood,fefunca,fefuncb,fefuncg,fefuncr,fegaussianblur,femerge,femergenode,' +
    'femorphology,feoffset,fepointlight,fespecularlighting,fespotlight,fetile,feturbulence,' +
    'g,image,line,lineargradient,marker,mask,path,pattern,polygon,polyline,radialgradient,' +
    'rect,stop,switch,symbol,text,textpath,title,tspan,use,view';
/** Attributes whose value is a URL and must match a safe pattern. */
const URL_ATTRIBUTES = 'background,cite,href,longdesc,src,xlink:href,xml:base';
/** Non-URL attributes that are safe to keep (HTML + SVG presentation attributes). */
const SAFE_ATTRIBUTES = 'abbr,accesskey,align,alt,autoplay,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
    'color,cols,colspan,compact,controls,coords,datetime,dir,download,face,headers,height,' +
    'hidden,hreflang,hspace,ismap,itemprop,itemscope,lang,language,loop,media,muted,nohref,' +
    'nowrap,open,preload,rel,rev,role,rows,rowspan,rules,scope,scrolling,shape,size,sizes,span,' +
    'srclang,srcset,start,style,summary,tabindex,target,title,translate,type,usemap,valign,' +
    'value,vspace,width,' +
    // SVG presentation and geometry attributes.
    'accent-height,alignment-baseline,baseline-shift,baseprofile,bbox,cap-height,clip,' +
    'clip-path,clip-rule,clippathunits,color-interpolation,color-interpolation-filters,' +
    'color-profile,color-rendering,cursor,cx,cy,d,direction,display,dominant-baseline,dx,dy,' +
    'fill,fill-opacity,fill-rule,filterunits,flood-color,flood-opacity,font-family,font-size,' +
    'font-size-adjust,font-stretch,font-style,font-variant,font-weight,fx,fy,' +
    'glyph-orientation-horizontal,glyph-orientation-vertical,gradienttransform,gradientunits,' +
    'image-rendering,in,in2,k1,k2,k3,k4,kerning,letter-spacing,lighting-color,marker-end,' +
    'marker-mid,marker-start,markerheight,markerunits,markerwidth,mask,maskcontentunits,' +
    'maskunits,mode,offset,opacity,operator,order,orient,overflow,paint-order,pathlength,' +
    'patterncontentunits,patterntransform,patternunits,points,preserveaspectratio,r,radius,' +
    'refx,refy,repeatcount,repeatdur,requiredextensions,requiredfeatures,restart,result,rotate,' +
    'rx,ry,scale,seed,shape-rendering,spreadmethod,startoffset,stddeviation,stop-color,' +
    'stop-opacity,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,' +
    'stroke-miterlimit,stroke-opacity,stroke-width,systemlanguage,text-anchor,text-decoration,' +
    'text-rendering,transform,transform-origin,u1,u2,unicode-bidi,vector-effect,version,' +
    'viewbox,visibility,white-space,word-spacing,writing-mode,x,x1,x2,xmlns,xmlns:xlink,' +
    'xml:lang,xml:space,y,y1,y2,zoomandpan';
const toSet = (csv) => new Set(csv.split(','));
const ALLOWED_ELEMENTS = toSet(HTML_ELEMENTS + ',' + SVG_ELEMENTS);
const ALLOWED_ATTRIBUTES = toSet(SAFE_ATTRIBUTES);
const URL_ATTRIBUTE_SET = toSet(URL_ATTRIBUTES);
/**
 * Safe URL pattern (same as Angular's): allows http(s), mailto, ftp, tel, sms
 * and relative URLs; rejects `javascript:`, `vbscript:` and other schemes.
 */
const SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^&:/?#]*(?:[/?#]|$))/i;
/** Safe `data:` URL pattern (same as Angular's): base64 image/video/audio only. */
const DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;
const isSafeUrl = (value) => {
    const url = value.trim();
    return SAFE_URL_PATTERN.test(url) || DATA_URL_PATTERN.test(url);
};
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Parses HTML into an inert document so nothing executes or loads while sanitizing. */
const parseInert = (html) => {
    if (typeof DOMParser !== 'undefined') {
        return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
    }
    if (typeof document !== 'undefined') {
        const inertDocument = document.implementation.createHTMLDocument('sanitization');
        inertDocument.body.innerHTML = html;
        return inertDocument.body;
    }
    return null;
};
const sanitizeAttributes = (element) => {
    const isUseElement = element.nodeName.toLowerCase() === 'use';
    for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        if (URL_ATTRIBUTE_SET.has(name)) {
            // `<use>` may only reference same-document fragments; external or data:
            // references are a known SVG attack vector.
            const safe = isUseElement
                ? attribute.value.trim().startsWith('#')
                : isSafeUrl(attribute.value);
            if (!safe) {
                element.removeAttribute(attribute.name);
            }
        }
        else if (name.startsWith('on') || !ALLOWED_ATTRIBUTES.has(name)) {
            element.removeAttribute(attribute.name);
        }
    }
};
const sanitizeChildren = (node) => {
    for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
            const element = child;
            if (!ALLOWED_ELEMENTS.has(element.nodeName.toLowerCase())) {
                // Drop disallowed elements entirely, including their subtree.
                node.removeChild(child);
                continue;
            }
            sanitizeAttributes(element);
            sanitizeChildren(element);
        }
        else if (child.nodeType !== 3 /* TEXT_NODE */) {
            // Remove comments, CDATA and processing instructions — all are mXSS vectors.
            node.removeChild(child);
        }
    }
};
/** Sanitizes an HTML string while keeping inline `<svg>` content. */
export const sanitizeHtml = (html) => {
    if (!html) {
        return '';
    }
    const body = parseInert(html);
    if (body === null) {
        // No DOM available (e.g. server-side rendering): render as plain text.
        return escapeHtml(html);
    }
    sanitizeChildren(body);
    return body.innerHTML;
};
/** Extracts the plain text of an HTML string (e.g. for ARIA descriptions). */
export const htmlToPlainText = (html) => {
    if (!html) {
        return '';
    }
    const body = parseInert(html);
    return (body === null ? html.replace(/<[^>]*>/g, ' ') : body.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9saXN0Ym94L2xpc3Rib3gtY3VzdG9tLXNhbml0aXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7O0dBWUc7QUFFSCxpRkFBaUY7QUFDakYsTUFBTSxhQUFhLEdBQ2pCLHNGQUFzRjtJQUN0Rix1RkFBdUY7SUFDdkYsd0ZBQXdGO0lBQ3hGLHNGQUFzRjtJQUN0Riw2REFBNkQsQ0FBQztBQUVoRSwwQ0FBMEM7QUFDMUMsTUFBTSxZQUFZLEdBQ2hCLHlGQUF5RjtJQUN6RixrRkFBa0Y7SUFDbEYsMEZBQTBGO0lBQzFGLHdGQUF3RjtJQUN4Rix1RkFBdUY7SUFDdkYsNERBQTRELENBQUM7QUFFL0QscUVBQXFFO0FBQ3JFLE1BQU0sY0FBYyxHQUFHLHVEQUF1RCxDQUFDO0FBRS9FLHFGQUFxRjtBQUNyRixNQUFNLGVBQWUsR0FDbkIsNEZBQTRGO0lBQzVGLHVGQUF1RjtJQUN2Rix3RkFBd0Y7SUFDeEYsNEZBQTRGO0lBQzVGLHdGQUF3RjtJQUN4RixxQkFBcUI7SUFDckIsNENBQTRDO0lBQzVDLG1GQUFtRjtJQUNuRixvRkFBb0Y7SUFDcEYseUZBQXlGO0lBQ3pGLDBGQUEwRjtJQUMxRiwwRUFBMEU7SUFDMUUsMEZBQTBGO0lBQzFGLHNGQUFzRjtJQUN0RixxRkFBcUY7SUFDckYsc0ZBQXNGO0lBQ3RGLHdGQUF3RjtJQUN4Riw0RkFBNEY7SUFDNUYsb0ZBQW9GO0lBQ3BGLHdGQUF3RjtJQUN4RiwyRkFBMkY7SUFDM0YscUZBQXFGO0lBQ3JGLHFGQUFxRjtJQUNyRix1Q0FBdUMsQ0FBQztBQUUxQyxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxD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UyxDQUFDO0FBQ3hCLENBQUMsQ0FBQztBQUVGLDhFQUE4RTtBQUM5RSxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsQ0FBQyxJQUFZLEVBQVUsRUFBRTtJQUN0RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFDRCxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsT0FBTyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztTQUM1RSxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztTQUNwQixJQUFJLEVBQUUsQ0FBQztBQUNaLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIERPTS1iYXNlZCBIVE1MIHNhbml0aXplciB0aGF0IHByZXNlcnZlcyBpbmxpbmUgU1ZHLlxuICpcbiAqIEFuZ3VsYXIncyBidWlsdC1pbiBzYW5pdGl6ZXIgc3RyaXBzIFNWRyBlbGVtZW50cywgd2hpY2ggaXMgdGhlIHJlYXNvbiB0aGlzIGZvcmtcbiAqIGV4aXN0cy4gVGhpcyBpbXBsZW1lbnRhdGlvbiBmb2xsb3dzIHRoZSBzYW1lIGFyY2hpdGVjdHVyZSBhcyBBbmd1bGFyJ3Mgc2FuaXRpemVyXG4gKiAocGFyc2UgaW50byBhbiBpbmVydCBkb2N1bWVudCwgd2FsayB0aGUgdHJlZSwga2VlcCBvbmx5IGFsbG93bGlzdGVkIGVsZW1lbnRzIGFuZFxuICogYXR0cmlidXRlcywgdmFsaWRhdGUgVVJMLXZhbHVlZCBhdHRyaWJ1dGVzKSBpbnN0ZWFkIG9mIHJlZ2V4IHJld3JpdGluZywgd2hpY2ggaXNcbiAqIGJ5cGFzc2FibGUgKHVucXVvdGVkIGV2ZW50IGhhbmRsZXJzLCB1bmNsb3NlZCB0YWdzLCBlbnRpdHktZW5jb2RlZCBVUkxzLCBldGMuKS5cbiAqXG4gKiBJbnRlbnRpb25hbGx5IE5PVCBhbGxvd2VkOiBzY3JpcHQsIHN0eWxlLCBpZnJhbWUsIG9iamVjdCwgZW1iZWQsIGZvcm0sIG1ldGEsXG4gKiBsaW5rLCBiYXNlLCB0ZW1wbGF0ZSwgbWF0aCwgZm9yZWlnbk9iamVjdCAobVhTUyB2ZWN0b3IpLCBTTUlMIGFuaW1hdGlvblxuICogZWxlbWVudHMgKGF0dHJpYnV0ZS1pbmplY3Rpb24gdmVjdG9yLCBlLmcuIGA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPVwiaHJlZlwiPmApLlxuICovXG5cbi8qKiBIVE1MIGVsZW1lbnRzIHRoYXQgYXJlIHNhZmUgdG8ga2VlcCAoc2FtZSBzZXQgQW5ndWxhcidzIHNhbml0aXplciBhbGxvd3MpLiAqL1xuY29uc3QgSFRNTF9FTEVNRU5UUyA9XG4gICdhZGRyZXNzLGFydGljbGUsYXNpZGUsYmxvY2txdW90ZSxjYXB0aW9uLGNlbnRlcixkZWwsZGV0YWlscyxkaWFsb2csZGlyLGRpdixkbCxkZCxkdCwnICtcbiAgJ2ZpZ3VyZSxmaWdjYXB0aW9uLGZvb3RlcixoMSxoMixoMyxoNCxoNSxoNixoZWFkZXIsaGdyb3VwLGhyLGlucyxtYWluLG1hcCxtZW51LG5hdixvbCwnICtcbiAgJ2xpLHVsLHByZSxzZWN0aW9uLHN1bW1hcnksdGFibGUsdGJvZHksdGQsdGZvb3QsdGgsdGhlYWQsdHIsYSxhYmJyLGFjcm9ueW0sYXVkaW8sYixiZGksJyArXG4gICdiZG8sYmlnLGJyLGNpdGUsY29kZSxlbSxmb250LGksaW1nLGtiZCxsYWJlbCxtYXJrLHBpY3R1cmUscSxycCxydCxydWJ5LHMsc2FtcCxzbWFsbCwnICtcbiAgJ3NvdXJjZSxzcGFuLHN0cmlrZSxzdHJvbmcsc3ViLHN1cCx0aW1lLHRyYWNrLHR0LHUsdmFyLHZpZGVvJztcblxuLyoqIFNWRyBlbGVtZW50cyB0aGF0IGFyZSBzYWZlIHRvIGtlZXAuICovXG5jb25zdCBTVkdfRUxFTUVOVFMgPVxuICAnc3ZnLGNpcmNsZSxjbGlwcGF0aCxkZWZzLGRlc2MsZWxsaXBzZSxmaWx0ZXIsZmVibGVuZCxmZWNvbG9ybWF0cml4LGZlY29tcG9uZW50dHJhbnNmZXIsJyArXG4gICdmZWNvbXBvc2l0ZSxmZWNvbnZvbHZlbWF0cml4LGZlZGlmZnVzZWxpZ2h0aW5nLGZlZGlzcGxhY2VtZW50bWFwLGZlZGlzdGFudGxpZ2h0LCcgK1xuICAnZmVkcm9wc2hhZG93LGZlZmxvb2QsZmVmdW5jYSxmZWZ1bmNiLGZlZnVuY2csZmVmdW5jcixmZWdhdXNzaWFuYmx1cixmZW1lcmdlLGZlbWVyZ2Vub2RlLCcgK1xuICAnZmVtb3JwaG9sb2d5LGZlb2Zmc2V0LGZlcG9pbnRsaWdodCxmZXNwZWN1bGFybGlnaHRpbmcsZmVzcG90bGlnaHQsZmV0aWxlLGZldHVyYnVsZW5jZSwnICtcbiAgJ2csaW1hZ2UsbGluZSxsaW5lYXJncmFkaWVudCxtYXJrZXIsbWFzayxwYXRoLHBhdHRlcm4scG9seWdvbixwb2x5bGluZSxyYWRpYWxncmFkaWVudCwnICtcbiAgJ3JlY3Qsc3RvcCxzd2l0Y2gsc3ltYm9sLHRleHQsdGV4dHBhdGgsdGl0bGUsdHNwYW4sdXNlLHZpZXcnO1xuXG4vKiogQXR0cmlidXRlcyB3aG9zZSB2YWx1ZSBpcyBhIFVSTCBhbmQgbXVzdCBtYXRjaCBhIHNhZmUgcGF0dGVybi4gKi9cbmNvbnN0IFVSTF9BVFRSSUJVVEVTID0gJ2JhY2tncm91bmQsY2l0ZSxocmVmLGxvbmdkZXNjLHNyYyx4bGluazpocmVmLHhtbDpiYXNlJztcblxuLyoqIE5vbi1VUkwgYXR0cmlidXRlcyB0aGF0IGFyZSBzYWZlIHRvIGtlZXAgKEhUTUwgKyBTVkcgcHJlc2VudGF0aW9uIGF0dHJpYnV0ZXMpLiAqL1xuY29uc3QgU0FGRV9BVFRSSUJVVEVTID1cbiAgJ2FiYnIsYWNjZXNza2V5LGFsaWduLGFsdCxhdXRvcGxheSxheGlzLGJnY29sb3IsYm9yZGVyLGNlbGxwYWRkaW5nLGNlbGxzcGFjaW5nLGNsYXNzLGNsZWFyLCcgK1xuICAnY29sb3IsY29scyxjb2xzcGFuLGNvbXBhY3QsY29udHJvbHMsY29vcmRzLGRhdGV0aW1lLGRpcixkb3dubG9hZCxmYWNlLGhlYWRlcnMsaGVpZ2h0LCcgK1xuICAnaGlkZGVuLGhyZWZsYW5nLGhzcGFjZSxpc21hcCxpdGVtcHJvcCxpdGVtc2NvcGUsbGFuZyxsYW5ndWFnZSxsb29wLG1lZGlhLG11dGVkLG5vaHJlZiwnICtcbiAgJ25vd3JhcCxvcGVuLHByZWxvYWQscmVsLHJldixyb2xlLHJvd3Mscm93c3BhbixydWxlcyxzY29wZSxzY3JvbGxpbmcsc2hhcGUsc2l6ZSxzaXplcyxzcGFuLCcgK1xuICAnc3JjbGFuZyxzcmNzZXQsc3RhcnQsc3R5bGUsc3VtbWFyeSx0YWJpbmRleCx0YXJnZXQsdGl0bGUsdHJhbnNsYXRlLHR5cGUsdXNlbWFwLHZhbGlnbiwnICtcbiAgJ3ZhbHVlLHZzcGFjZSx3aWR0aCwnICtcbiAgLy8gU1ZHIHByZXNlbnRhdGlvbiBhbmQgZ2VvbWV0cnkgYXR0cmlidXRlcy5cbiAgJ2FjY2VudC1oZWlnaHQsYWxpZ25tZW50LWJhc2VsaW5lLGJhc2VsaW5lLXNoaWZ0LGJhc2Vwcm9maWxlLGJib3gsY2FwLWhlaWdodCxjbGlwLCcgK1xuICAnY2xpcC1wYXRoLGNsaXAtcnVsZSxjbGlwcGF0aHVuaXRzLGNvbG9yLWludGVycG9sYXRpb24sY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzLCcgK1xuICAnY29sb3ItcHJvZmlsZSxjb2xvci1yZW5kZXJpbmcsY3Vyc29yLGN4LGN5LGQsZGlyZWN0aW9uLGRpc3BsYXksZG9taW5hbnQtYmFzZWxpbmUsZHgsZHksJyArXG4gICdmaWxsLGZpbGwtb3BhY2l0eSxmaWxsLXJ1bGUsZmlsdGVydW5pdHMsZmxvb2QtY29sb3IsZmxvb2Qtb3BhY2l0eSxmb250LWZhbWlseSxmb250LXNpemUsJyArXG4gICdmb250LXNpemUtYWRqdXN0LGZvbnQtc3RyZXRjaCxmb250LXN0eWxlLGZvbnQtdmFyaWFudCxmb250LXdlaWdodCxmeCxmeSwnICtcbiAgJ2dseXBoLW9yaWVudGF0aW9uLWhvcml6b250YWwsZ2x5cGgtb3JpZW50YXRpb24tdmVydGljYWwsZ3JhZGllbnR0cmFuc2Zvcm0sZ3JhZGllbnR1bml0cywnICtcbiAgJ2ltYWdlLXJlbmRlcmluZyxpbixpbjIsazEsazIsazMsazQsa2VybmluZyxsZXR0ZXItc3BhY2luZyxsaWdodGluZy1jb2xvcixtYXJrZXItZW5kLCcgK1xuICAnbWFya2VyLW1pZCxtYXJrZXItc3RhcnQsbWFya2VyaGVpZ2h0LG1hcmtlcnVuaXRzLG1hcmtlcndpZHRoLG1hc2ssbWFza2NvbnRlbnR1bml0cywnICtcbiAgJ21hc2t1bml0cyxtb2RlLG9mZnNldCxvcGFjaXR5LG9wZXJhdG9yLG9yZGVyLG9yaWVudCxvdmVyZmxvdyxwYWludC1vcmRlcixwYXRobGVuZ3RoLCcgK1xuICAncGF0dGVybmNvbnRlbnR1bml0cyxwYXR0ZXJudHJhbnNmb3JtLHBhdHRlcm51bml0cyxwb2ludHMscHJlc2VydmVhc3BlY3RyYXRpbyxyLHJhZGl1cywnICtcbiAgJ3JlZngscmVmeSxyZXBlYXRjb3VudCxyZXBlYXRkdXIscmVxdWlyZWRleHRlbnNpb25zLHJlcXVpcmVkZmVhdHVyZXMscmVzdGFydCxyZXN1bHQscm90YXRlLCcgK1xuICAncngscnksc2NhbGUsc2VlZCxzaGFwZS1yZW5kZXJpbmcsc3ByZWFkbWV0aG9kLHN0YXJ0b2Zmc2V0LHN0ZGRldmlhdGlvbixzdG9wLWNvbG9yLCcgK1xuICAnc3RvcC1vcGFjaXR5LHN0cm9rZSxzdHJva2UtZGFzaGFycmF5LHN0cm9rZS1kYXNob2Zmc2V0LHN0cm9rZS1saW5lY2FwLHN0cm9rZS1saW5lam9pbiwnICtcbiAgJ3N0cm9rZS1taXRlcmxpbWl0LHN0cm9rZS1vcGFjaXR5LHN0cm9rZS13aWR0aCxzeXN0ZW1sYW5ndWFnZSx0ZXh0LWFuY2hvcix0ZXh0LWRlY29yYXRpb24sJyArXG4gICd0ZXh0LXJlbmRlcmluZyx0cmFuc2Zvcm0sdHJhbnNmb3JtLW9yaWdpbix1MSx1Mix1bmljb2RlLWJpZGksdmVjdG9yLWVmZmVjdCx2ZXJzaW9uLCcgK1xuICAndmlld2JveCx2aXNpYmlsaXR5LHdoaXRlLXNwYWNlLHdvcmQtc3BhY2luZyx3cml0aW5nLW1vZGUseCx4MSx4Mix4bWxucyx4bWxuczp4bGluaywnICtcbiAgJ3htbDpsYW5nLHhtbDpzcGFjZSx5LHkxLHkyLHpvb21hbmRwYW4nO1xuXG5jb25zdCB0b1NldCA9IChjc3Y6IHN0cmluZykgPT4gbmV3IFNldChjc3Yuc3BsaXQoJywnKSk7XG5cbmNvbnN0IEFMTE9XRURfRUxFTUVOVFMgPSB0b1NldChIVE1MX0VMRU1FTlRTICsgJywnICsgU1ZHX0VMRU1FTlRTKTtcbmNvbnN0IEFMTE9XRURfQVRUUklCVVRFUyA9IHRvU2V0KFNBRkVfQVRUUklCVVRFUyk7XG5jb25zdCBVUkxfQVRUUklCVVRFX1NFVCA9IHRvU2V0KFVSTF9BVFRSSUJVVEVTKTtcblxuLyoqXG4gKiBTYWZlIFVSTCBwYXR0ZXJuIChzYW1lIGFzIEFuZ3VsYXIncyk6IGFsbG93cyBodHRwKHMpLCBtYWlsdG8sIGZ0cCwgdGVsLCBzbXNcbiAqIGFuZCByZWxhdGl2ZSBVUkxzOyByZWplY3RzIGBqYXZhc2NyaXB0OmAsIGB2YnNjcmlwdDpgIGFuZCBvdGhlciBzY2hlbWVzLlxuICovXG5jb25zdCBTQUZFX1VSTF9QQVRURVJOID0gL14oPzooPzpodHRwcz98bWFpbHRvfGZ0cHx0ZWx8ZmlsZXxzbXMpOnxbXiY6Lz8jXSooPzpbLz8jXXwkKSkvaTtcblxuLyoqIFNhZmUgYGRhdGE6YCBVUkwgcGF0dGVybiAoc2FtZSBhcyBBbmd1bGFyJ3MpOiBiYXNlNjQgaW1hZ2UvdmlkZW8vYXVkaW8gb25seS4gKi9cbmNvbnN0IERBVEFfVVJMX1BBVFRFUk4gPVxuICAvXmRhdGE6KD86aW1hZ2VcXC8oPzpibXB8Z2lmfGpwZWd8anBnfHBuZ3x0aWZmfHdlYnApfHZpZGVvXFwvKD86bXBlZ3xtcDR8b2dnfHdlYm0pfGF1ZGlvXFwvKD86bXAzfG9nYXxvZ2d8b3B1cykpO2Jhc2U2NCxbYS16MC05Ky9dKz0qJC9pO1xuXG5jb25zdCBpc1NhZmVVcmwgPSAodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuICBjb25zdCB1cmwgPSB2YWx1ZS50cmltKCk7XG4gIHJldHVybiBTQUZFX1VSTF9QQVRURVJOLnRlc3QodXJsKSB8fCBEQVRBX1VSTF9QQVRURVJOLnRlc3QodXJsKTtcbn07XG5cbmNvbnN0IGVzY2FwZUh0bWwgPSAodGV4dDogc3RyaW5nKTogc3RyaW5nID0+XG4gIHRleHQucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuXG4vKiogUGFyc2VzIEhUTUwgaW50byBhbiBpbmVydCBkb2N1bWVudCBzbyBub3RoaW5nIGV4ZWN1dGVzIG9yIGxvYWRzIHdoaWxlIHNhbml0aXppbmcuICovXG5jb25zdCBwYXJzZUluZXJ0ID0gKGh0bWw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHwgbnVsbCA9PiB7XG4gIGlmICh0eXBlb2YgRE9NUGFyc2VyICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGA8Ym9keT4ke2h0bWx9PC9ib2R5PmAsICd0ZXh0L2h0bWwnKS5ib2R5O1xuICB9XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uc3QgaW5lcnREb2N1bWVudCA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgnc2FuaXRpemF0aW9uJyk7XG4gICAgaW5lcnREb2N1bWVudC5ib2R5LmlubmVySFRNTCA9IGh0bWw7XG4gICAgcmV0dXJuIGluZXJ0RG9jdW1lbnQuYm9keTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cbmNvbnN0IHNhbml0aXplQXR0cmlidXRlcyA9IChlbGVtZW50OiBFbGVtZW50KTogdm9pZCA9PiB7XG4gIGNvbnN0IGlzVXNlRWxlbWVudCA9IGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3VzZSc7XG4gIGZvciAoY29uc3QgYXR0cmlidXRlIG9mIEFycmF5LmZyb20oZWxlbWVudC5hdHRyaWJ1dGVzKSkge1xuICAgIGNvbnN0IG5hbWUgPSBhdHRyaWJ1dGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChVUkxfQVRUUklCVVRFX1NFVC5oYXMobmFtZSkpIHtcbiAgICAgIC8vIGA8dXNlPmAgbWF5IG9ubHkgcmVmZXJlbmNlIHNhbWUtZG9jdW1lbnQgZnJhZ21lbnRzOyBleHRlcm5hbCBvciBkYXRhOlxuICAgICAgLy8gcmVmZXJlbmNlcyBhcmUgYSBrbm93biBTVkcgYXR0YWNrIHZlY3Rvci5cbiAgICAgIGNvbnN0IHNhZmUgPSBpc1VzZUVsZW1lbnRcbiAgICAgICAgPyBhdHRyaWJ1dGUudmFsdWUudHJpbSgpLnN0YXJ0c1dpdGgoJyMnKVxuICAgICAgICA6IGlzU2FmZVVybChhdHRyaWJ1dGUudmFsdWUpO1xuICAgICAgaWYgKCFzYWZlKSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aCgnb24nKSB8fCAhQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhuYW1lKSkge1xuICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUpO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3Qgc2FuaXRpemVDaGlsZHJlbiA9IChub2RlOiBOb2RlKTogdm9pZCA9PiB7XG4gIGZvciAoY29uc3QgY2hpbGQgb2YgQXJyYXkuZnJvbShub2RlLmNoaWxkTm9kZXMpKSB7XG4gICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSAxIC8qIEVMRU1FTlRfTk9ERSAqLykge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGNoaWxkIGFzIEVsZW1lbnQ7XG4gICAgICBpZiAoIUFMTE9XRURfRUxFTUVOVFMuaGFzKGVsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgLy8gRHJvcCBkaXNhbGxvd2VkIGVsZW1lbnRzIGVudGlyZWx5LCBpbmNsdWRpbmcgdGhlaXIgc3VidHJlZS5cbiAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2FuaXRpemVBdHRyaWJ1dGVzKGVsZW1lbnQpO1xuICAgICAgc2FuaXRpemVDaGlsZHJlbihlbGVtZW50KTtcbiAgICB9IGVsc2UgaWYgKGNoaWxkLm5vZGVUeXBlICE9PSAzIC8qIFRFWFRfTk9ERSAqLykge1xuICAgICAgLy8gUmVtb3ZlIGNvbW1lbnRzLCBDREFUQSBhbmQgcHJvY2Vzc2luZyBpbnN0cnVjdGlvbnMg4oCUIGFsbCBhcmUgbVhTUyB2ZWN0b3JzLlxuICAgICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgfVxuICB9XG59O1xuXG4vKiogU2FuaXRpemVzIGFuIEhUTUwgc3RyaW5nIHdoaWxlIGtlZXBpbmcgaW5saW5lIGA8c3ZnPmAgY29udGVudC4gKi9cbmV4cG9ydCBjb25zdCBzYW5pdGl6ZUh0bWwgPSAoaHRtbDogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgaWYgKCFodG1sKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGNvbnN0IGJvZHkgPSBwYXJzZUluZXJ0KGh0bWwpO1xuICBpZiAoYm9keSA9PT0gbnVsbCkge1xuICAgIC8vIE5vIERPTSBhdmFpbGFibGUgKGUuZy4gc2VydmVyLXNpZGUgcmVuZGVyaW5nKTogcmVuZGVyIGFzIHBsYWluIHRleHQuXG4gICAgcmV0dXJuIGVzY2FwZUh0bWwoaHRtbCk7XG4gIH1cbiAgc2FuaXRpemVDaGlsZHJlbihib2R5KTtcbiAgcmV0dXJuIGJvZHkuaW5uZXJIVE1MO1xufTtcblxuLyoqIEV4dHJhY3RzIHRoZSBwbGFpbiB0ZXh0IG9mIGFuIEhUTUwgc3RyaW5nIChlLmcuIGZvciBBUklBIGRlc2NyaXB0aW9ucykuICovXG5leHBvcnQgY29uc3QgaHRtbFRvUGxhaW5UZXh0ID0gKGh0bWw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIGlmICghaHRtbCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBjb25zdCBib2R5ID0gcGFyc2VJbmVydChodG1sKTtcbiAgcmV0dXJuIChib2R5ID09PSBudWxsID8gaHRtbC5yZXBsYWNlKC88W14+XSo+L2csICcgJykgOiBib2R5LnRleHRDb250ZW50IHx8ICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAudHJpbSgpO1xufTtcbiJdfQ==