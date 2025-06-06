/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Function to sanitize HTML while keeping &lt;svg&gt; */
export const sanitizeHtml = (html) => {
    /** Remove &lt;script&gt;, &lt;iframe&gt;, &lt;object&gt;, &lt;embed&gt;, &lt;form&gt;, &lt;style&gt;, &lt;meta&gt;, &lt;link&gt;, &lt;base&gt; */
    html = html.replace(/<(script|iframe|object|embed|form|meta|style|link|base)[^>]*>[\s\S]*?<\/\1>/gi, '');
    // Remove dangerous attributes (onX events, javascript: links)
    html = html.replace(/\son\w+="[^"]*"/gi, ''); // Remove event handlers (e.g., onclick)
    html = html.replace(/\son\w+='[^']*'/gi, ''); // Remove event handlers (single quotes)
    html = html.replace(/\shref=['"](javascript:)[^'"]*['"]/gi, 'href="#"'); // Prevent javascript: links
    html = html.replace(/\ssrc=['"](javascript:)[^'"]*['"]/gi, ''); // Prevent javascript: in src
    return html;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC1jdXN0b20tc2FuaXRpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2Nkay9saXN0Ym94L2xpc3Rib3gtY3VzdG9tLXNhbml0aXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCwwREFBMEQ7QUFDMUQsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBWSxFQUFVLEVBQUU7SUFDbkQsa0pBQWtKO0lBQ2xKLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUNqQiwrRUFBK0UsRUFDL0UsRUFBRSxDQUNILENBQUM7SUFFRiw4REFBOEQ7SUFDOUQsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyx3Q0FBd0M7SUFDdEYsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyx3Q0FBd0M7SUFDdEYsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0NBQXNDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7SUFDckcsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMscUNBQXFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyw2QkFBNkI7SUFFN0YsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIEZ1bmN0aW9uIHRvIHNhbml0aXplIEhUTUwgd2hpbGUga2VlcGluZyAmbHQ7c3ZnJmd0OyAqL1xuZXhwb3J0IGNvbnN0IHNhbml0aXplSHRtbCA9IChodG1sOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAvKiogUmVtb3ZlICZsdDtzY3JpcHQmZ3Q7LCAmbHQ7aWZyYW1lJmd0OywgJmx0O29iamVjdCZndDssICZsdDtlbWJlZCZndDssICZsdDtmb3JtJmd0OywgJmx0O3N0eWxlJmd0OywgJmx0O21ldGEmZ3Q7LCAmbHQ7bGluayZndDssICZsdDtiYXNlJmd0OyAqL1xuICBodG1sID0gaHRtbC5yZXBsYWNlKFxuICAgIC88KHNjcmlwdHxpZnJhbWV8b2JqZWN0fGVtYmVkfGZvcm18bWV0YXxzdHlsZXxsaW5rfGJhc2UpW14+XSo+W1xcc1xcU10qPzxcXC9cXDE+L2dpLFxuICAgICcnLFxuICApO1xuXG4gIC8vIFJlbW92ZSBkYW5nZXJvdXMgYXR0cmlidXRlcyAob25YIGV2ZW50cywgamF2YXNjcmlwdDogbGlua3MpXG4gIGh0bWwgPSBodG1sLnJlcGxhY2UoL1xcc29uXFx3Kz1cIlteXCJdKlwiL2dpLCAnJyk7IC8vIFJlbW92ZSBldmVudCBoYW5kbGVycyAoZS5nLiwgb25jbGljaylcbiAgaHRtbCA9IGh0bWwucmVwbGFjZSgvXFxzb25cXHcrPSdbXiddKicvZ2ksICcnKTsgLy8gUmVtb3ZlIGV2ZW50IGhhbmRsZXJzIChzaW5nbGUgcXVvdGVzKVxuICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNocmVmPVsnXCJdKGphdmFzY3JpcHQ6KVteJ1wiXSpbJ1wiXS9naSwgJ2hyZWY9XCIjXCInKTsgLy8gUHJldmVudCBqYXZhc2NyaXB0OiBsaW5rc1xuICBodG1sID0gaHRtbC5yZXBsYWNlKC9cXHNzcmM9WydcIl0oamF2YXNjcmlwdDopW14nXCJdKlsnXCJdL2dpLCAnJyk7IC8vIFByZXZlbnQgamF2YXNjcmlwdDogaW4gc3JjXG5cbiAgcmV0dXJuIGh0bWw7XG59O1xuIl19