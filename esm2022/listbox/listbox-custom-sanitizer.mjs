/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DomSanitizer } from '@angular/platform-browser';
import { Injectable, SecurityContext } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Custom sanitizer that allows &lt;svg&gt; but removes dangerous content
 * @docs-private
 */
export class CdkListboxCustomSanitizer extends DomSanitizer {
    constructor() {
        super();
    }
    /** Main sanitization function */
    sanitize(context, value) {
        if (context === SecurityContext.HTML && typeof value === 'string') {
            return this._sanitizeHtml(value);
        }
        return value;
    }
    /** Function to sanitize HTML while keeping &lt;svg&gt; */
    _sanitizeHtml(html) {
        /** Remove &lt;script&gt;, &lt;iframe&gt;, &lt;object&gt;, &lt;embed&gt;, &lt;form&gt;, &lt;style&gt;, &lt;meta&gt;, &lt;link&gt;, &lt;base&gt; */
        html = html.replace(/<(script|iframe|object|embed|form|meta|style|link|base)[^>]*>[\s\S]*?<\/\1>/gi, '');
        // Remove dangerous attributes (onX events, javascript: links)
        html = html.replace(/\son\w+="[^"]*"/gi, ''); // Remove event handlers (e.g., onclick)
        html = html.replace(/\son\w+='[^']*'/gi, ''); // Remove event handlers (single quotes)
        html = html.replace(/\shref=['"](javascript:)[^'"]*['"]/gi, 'href="#"'); // Prevent javascript: links
        html = html.replace(/\ssrc=['"](javascript:)[^'"]*['"]/gi, ''); // Prevent javascript: in src
        return html;
    }
    /** Bypass security trust for safe HTML */
    bypassSecurityTrustHtml(value) {
        return value;
    }
    bypassSecurityTrustStyle(value) {
        return value;
    }
    bypassSecurityTrustScript(value) {
        return value;
    }
    bypassSecurityTrustUrl(value) {
        return value;
    }
    bypassSecurityTrustResourceUrl(value) {
        return value;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListboxCustomSanitizer, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListboxCustomSanitizer, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListboxCustomSanitizer, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9saXN0Ym94L2xpc3Rib3gtY3VzdG9tLXNhbml0aXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsWUFBWSxFQUFXLE1BQU0sMkJBQTJCLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBRSxlQUFlLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBRTFEOzs7R0FHRztBQUVILE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxZQUFZO0lBQ3pEO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLFFBQVEsQ0FBQyxPQUF3QixFQUFFLEtBQW9CO1FBQ3JELElBQUksT0FBTyxLQUFLLGVBQWUsQ0FBQyxJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDbEUsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCwwREFBMEQ7SUFDbEQsYUFBYSxDQUFDLElBQVk7UUFDaEMsa0pBQWtKO1FBQ2xKLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUNqQiwrRUFBK0UsRUFDL0UsRUFBRSxDQUNILENBQUM7UUFFRiw4REFBOEQ7UUFDOUQsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyx3Q0FBd0M7UUFDdEYsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyx3Q0FBd0M7UUFDdEYsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0NBQXNDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7UUFDckcsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMscUNBQXFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyw2QkFBNkI7UUFFN0YsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsMENBQTBDO0lBQzFDLHVCQUF1QixDQUFDLEtBQWE7UUFDbkMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsd0JBQXdCLENBQUMsS0FBYTtRQUNwQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCx5QkFBeUIsQ0FBQyxLQUFhO1FBQ3JDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELHNCQUFzQixDQUFDLEtBQWE7UUFDbEMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRUQsOEJBQThCLENBQUMsS0FBYTtRQUMxQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7cUhBakRVLHlCQUF5Qjt5SEFBekIseUJBQXlCLGNBRGIsTUFBTTs7a0dBQ2xCLHlCQUF5QjtrQkFEckMsVUFBVTttQkFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7RG9tU2FuaXRpemVyLCBTYWZlSHRtbH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5pbXBvcnQge0luamVjdGFibGUsIFNlY3VyaXR5Q29udGV4dH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qKlxuICogQ3VzdG9tIHNhbml0aXplciB0aGF0IGFsbG93cyAmbHQ7c3ZnJmd0OyBidXQgcmVtb3ZlcyBkYW5nZXJvdXMgY29udGVudFxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDZGtMaXN0Ym94Q3VzdG9tU2FuaXRpemVyIGV4dGVuZHMgRG9tU2FuaXRpemVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKiBNYWluIHNhbml0aXphdGlvbiBmdW5jdGlvbiAqL1xuICBzYW5pdGl6ZShjb250ZXh0OiBTZWN1cml0eUNvbnRleHQsIHZhbHVlOiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGNvbnRleHQgPT09IFNlY3VyaXR5Q29udGV4dC5IVE1MICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zYW5pdGl6ZUh0bWwodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKiogRnVuY3Rpb24gdG8gc2FuaXRpemUgSFRNTCB3aGlsZSBrZWVwaW5nICZsdDtzdmcmZ3Q7ICovXG4gIHByaXZhdGUgX3Nhbml0aXplSHRtbChodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8qKiBSZW1vdmUgJmx0O3NjcmlwdCZndDssICZsdDtpZnJhbWUmZ3Q7LCAmbHQ7b2JqZWN0Jmd0OywgJmx0O2VtYmVkJmd0OywgJmx0O2Zvcm0mZ3Q7LCAmbHQ7c3R5bGUmZ3Q7LCAmbHQ7bWV0YSZndDssICZsdDtsaW5rJmd0OywgJmx0O2Jhc2UmZ3Q7ICovXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZShcbiAgICAgIC88KHNjcmlwdHxpZnJhbWV8b2JqZWN0fGVtYmVkfGZvcm18bWV0YXxzdHlsZXxsaW5rfGJhc2UpW14+XSo+W1xcc1xcU10qPzxcXC9cXDE+L2dpLFxuICAgICAgJycsXG4gICAgKTtcblxuICAgIC8vIFJlbW92ZSBkYW5nZXJvdXMgYXR0cmlidXRlcyAob25YIGV2ZW50cywgamF2YXNjcmlwdDogbGlua3MpXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzb25cXHcrPVwiW15cIl0qXCIvZ2ksICcnKTsgLy8gUmVtb3ZlIGV2ZW50IGhhbmRsZXJzIChlLmcuLCBvbmNsaWNrKVxuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc29uXFx3Kz0nW14nXSonL2dpLCAnJyk7IC8vIFJlbW92ZSBldmVudCBoYW5kbGVycyAoc2luZ2xlIHF1b3RlcylcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNocmVmPVsnXCJdKGphdmFzY3JpcHQ6KVteJ1wiXSpbJ1wiXS9naSwgJ2hyZWY9XCIjXCInKTsgLy8gUHJldmVudCBqYXZhc2NyaXB0OiBsaW5rc1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc3NyYz1bJ1wiXShqYXZhc2NyaXB0OilbXidcIl0qWydcIl0vZ2ksICcnKTsgLy8gUHJldmVudCBqYXZhc2NyaXB0OiBpbiBzcmNcblxuICAgIHJldHVybiBodG1sO1xuICB9XG5cbiAgLyoqIEJ5cGFzcyBzZWN1cml0eSB0cnVzdCBmb3Igc2FmZSBIVE1MICovXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RIdG1sKHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdFN0eWxlKHZhbHVlOiBzdHJpbmcpOiBTYWZlSHRtbCB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgYnlwYXNzU2VjdXJpdHlUcnVzdFNjcmlwdCh2YWx1ZTogc3RyaW5nKTogU2FmZUh0bWwge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGJ5cGFzc1NlY3VyaXR5VHJ1c3RVcmwodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBieXBhc3NTZWN1cml0eVRydXN0UmVzb3VyY2VVcmwodmFsdWU6IHN0cmluZyk6IFNhZmVIdG1sIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==