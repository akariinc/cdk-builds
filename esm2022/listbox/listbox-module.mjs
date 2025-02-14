/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { CdkListbox, CdkOption } from './listbox';
import { CdkListboxCustomSanitizer } from './listbox-custom-sanitizer';
import { DomSanitizer } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import * as i0 from "@angular/core";
const EXPORTED_DECLARATIONS = [CdkListbox, CdkOption];
export class CdkListboxModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListboxModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListboxModule, imports: [CdkListbox, CdkOption], exports: [CdkListbox, CdkOption] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListboxModule, providers: [{ provide: DomSanitizer, useClass: CdkListboxCustomSanitizer }] }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListboxModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [...EXPORTED_DECLARATIONS],
                    exports: [...EXPORTED_DECLARATIONS],
                    providers: [{ provide: DomSanitizer, useClass: CdkListboxCustomSanitizer }],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC1tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2RrL2xpc3Rib3gvbGlzdGJveC1tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFaEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDckUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBRXZDLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFPdEQsTUFBTSxPQUFPLGdCQUFnQjtxSEFBaEIsZ0JBQWdCO3NIQUFoQixnQkFBZ0IsWUFQRSxVQUFVLEVBQUUsU0FBUyxhQUFyQixVQUFVLEVBQUUsU0FBUztzSEFPdkMsZ0JBQWdCLGFBRmhCLENBQUMsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBeUIsRUFBQyxDQUFDOztrR0FFOUQsZ0JBQWdCO2tCQUw1QixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLEdBQUcscUJBQXFCLENBQUM7b0JBQ25DLE9BQU8sRUFBRSxDQUFDLEdBQUcscUJBQXFCLENBQUM7b0JBQ25DLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQXlCLEVBQUMsQ0FBQztpQkFDMUUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDZGtMaXN0Ym94LCBDZGtPcHRpb259IGZyb20gJy4vbGlzdGJveCc7XG5cbmltcG9ydCB7Q2RrTGlzdGJveEN1c3RvbVNhbml0aXplcn0gZnJvbSAnLi9saXN0Ym94LWN1c3RvbS1zYW5pdGl6ZXInO1xuaW1wb3J0IHtEb21TYW5pdGl6ZXJ9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmNvbnN0IEVYUE9SVEVEX0RFQ0xBUkFUSU9OUyA9IFtDZGtMaXN0Ym94LCBDZGtPcHRpb25dO1xuXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbLi4uRVhQT1JURURfREVDTEFSQVRJT05TXSxcbiAgZXhwb3J0czogWy4uLkVYUE9SVEVEX0RFQ0xBUkFUSU9OU10sXG4gIHByb3ZpZGVyczogW3twcm92aWRlOiBEb21TYW5pdGl6ZXIsIHVzZUNsYXNzOiBDZGtMaXN0Ym94Q3VzdG9tU2FuaXRpemVyfV0sXG59KVxuZXhwb3J0IGNsYXNzIENka0xpc3Rib3hNb2R1bGUge31cbiJdfQ==