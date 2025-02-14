/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { coerceArray } from '@angular/cdk/coercion';
import { SelectionModel } from '@angular/cdk/collections';
import { A, DOWN_ARROW, END, ENTER, hasModifierKey, HOME, LEFT_ARROW, RIGHT_ARROW, SPACE, UP_ARROW, } from '@angular/cdk/keycodes';
import { Platform } from '@angular/cdk/platform';
import { booleanAttribute, ChangeDetectorRef, ContentChildren, Directive, ElementRef, forwardRef, inject, Input, NgZone, Output, QueryList, signal, Renderer2, } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { defer, fromEvent, merge, Subject } from 'rxjs';
import { filter, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import * as i0 from "@angular/core";
/** The next id to use for creating unique DOM IDs. */
let nextId = 0;
/**
 * An implementation of SelectionModel that internally always represents the selection as a
 * multi-selection. This is necessary so that we can recover the full selection if the user
 * switches the listbox from single-selection to multi-selection after initialization.
 *
 * This selection model may report multiple selected values, even if it is in single-selection
 * mode. It is up to the user (CdkListbox) to check for invalid selections.
 */
class ListboxSelectionModel extends SelectionModel {
    constructor(multiple = false, initiallySelectedValues, emitChanges = true, compareWith) {
        super(true, initiallySelectedValues, emitChanges, compareWith);
        this.multiple = multiple;
    }
    isMultipleSelection() {
        return this.multiple;
    }
    select(...values) {
        // The super class is always in multi-selection mode, so we need to override the behavior if
        // this selection model actually belongs to a single-selection listbox.
        if (this.multiple) {
            return super.select(...values);
        }
        else {
            return super.setSelection(...values);
        }
    }
}
/** A selectable option in a listbox. */
export class CdkOption {
    constructor() {
        this._generatedId = `cdk-option-${nextId++}`;
        this._disabled = signal(false);
        this._enabledTabIndex = signal(undefined);
        /** The option's host element */
        this.element = inject(ElementRef).nativeElement;
        /** The parent listbox this option belongs to. */
        this.listbox = inject(CdkListbox);
        /** The renderer used to modify the listbox element. */
        this.renderer = inject(Renderer2);
        /** Emits when the option is destroyed. */
        this.destroyed = new Subject();
        /** Emits when the option is clicked. */
        this._clicked = new Subject();
    }
    /** The id of the option's host element. */
    get id() {
        return this._id || this._generatedId;
    }
    set id(value) {
        this._id = value;
    }
    /** Whether this option is disabled. */
    get disabled() {
        return this.listbox.disabled || this._disabled();
    }
    set disabled(value) {
        this._disabled.set(value);
    }
    /** The tabindex of the option when it is enabled. */
    get enabledTabIndex() {
        return this._enabledTabIndex() === undefined
            ? this.listbox.enabledTabIndex
            : this._enabledTabIndex();
    }
    set enabledTabIndex(value) {
        this._enabledTabIndex.set(value);
    }
    ngOnInit() {
        this.renderer.setProperty(this.element, 'innerHTML', this.value);
    }
    ngOnDestroy() {
        this.destroyed.next();
        this.destroyed.complete();
    }
    /** Whether this option is selected. */
    isSelected() {
        return this.listbox.isSelected(this);
    }
    /** Whether this option is active. */
    isActive() {
        return this.listbox.isActive(this);
    }
    /** Toggle the selected state of this option. */
    toggle() {
        this.listbox.toggle(this);
    }
    /** Select this option if it is not selected. */
    select() {
        this.listbox.select(this);
    }
    /** Deselect this option if it is selected. */
    deselect() {
        this.listbox.deselect(this);
    }
    /** Focus this option. */
    focus() {
        this.element.focus();
    }
    /** Get the label for this element which is required by the FocusableOption interface. */
    getLabel() {
        return (this.typeaheadLabel ?? this.element.textContent?.trim()) || '';
    }
    /**
     * No-op implemented as a part of `Highlightable`.
     * @docs-private
     */
    setActiveStyles() {
        // If the listbox is using `aria-activedescendant` the option won't have focus so the
        // browser won't scroll them into view automatically so we need to do it ourselves.
        if (this.listbox.useActiveDescendant) {
            this.element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }
    /**
     * No-op implemented as a part of `Highlightable`.
     * @docs-private
     */
    setInactiveStyles() { }
    /** Handle focus events on the option. */
    _handleFocus() {
        // Options can wind up getting focused in active descendant mode if the user clicks on them.
        // In this case, we push focus back to the parent listbox to prevent an extra tab stop when
        // the user performs a shift+tab.
        if (this.listbox.useActiveDescendant) {
            this.listbox._setActiveOption(this);
            this.listbox.focus();
        }
    }
    /** Get the tabindex for this option. */
    _getTabIndex() {
        if (this.listbox.useActiveDescendant || this.disabled) {
            return -1;
        }
        return this.isActive() ? this.enabledTabIndex : -1;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkOption, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "18.2.0-next.2", type: CdkOption, isStandalone: true, selector: "[cdkOption]", inputs: { id: "id", value: ["cdkOption", "value"], typeaheadLabel: ["cdkOptionTypeaheadLabel", "typeaheadLabel"], disabled: ["cdkOptionDisabled", "disabled", booleanAttribute], enabledTabIndex: ["tabindex", "enabledTabIndex"] }, host: { attributes: { "role": "option" }, listeners: { "click": "_clicked.next($event)", "focus": "_handleFocus()" }, properties: { "id": "id", "attr.aria-selected": "isSelected()", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "class.cdk-option-active": "isActive()" }, classAttribute: "cdk-option" }, exportAs: ["cdkOption"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkOption, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkOption]',
                    standalone: true,
                    exportAs: 'cdkOption',
                    host: {
                        'role': 'option',
                        'class': 'cdk-option',
                        '[id]': 'id',
                        '[attr.aria-selected]': 'isSelected()',
                        '[attr.tabindex]': '_getTabIndex()',
                        '[attr.aria-disabled]': 'disabled',
                        '[class.cdk-option-active]': 'isActive()',
                        '(click)': '_clicked.next($event)',
                        '(focus)': '_handleFocus()',
                    },
                }]
        }], propDecorators: { id: [{
                type: Input
            }], value: [{
                type: Input,
                args: ['cdkOption']
            }], typeaheadLabel: [{
                type: Input,
                args: ['cdkOptionTypeaheadLabel']
            }], disabled: [{
                type: Input,
                args: [{ alias: 'cdkOptionDisabled', transform: booleanAttribute }]
            }], enabledTabIndex: [{
                type: Input,
                args: ['tabindex']
            }] } });
export class CdkListbox {
    /** The id of the option's host element. */
    get id() {
        return this._id || this._generatedId;
    }
    set id(value) {
        this._id = value;
    }
    /** The tabindex to use when the listbox is enabled. */
    get enabledTabIndex() {
        return this._enabledTabIndex() === undefined ? 0 : this._enabledTabIndex();
    }
    set enabledTabIndex(value) {
        this._enabledTabIndex.set(value);
    }
    /** The value selected in the listbox, represented as an array of option values. */
    get value() {
        return this._invalid ? [] : this.selectionModel.selected;
    }
    set value(value) {
        this._setSelection(value);
    }
    /**
     * Whether the listbox allows multiple options to be selected. If the value switches from `true`
     * to `false`, and more than one option is selected, all options are deselected.
     */
    get multiple() {
        return this.selectionModel.multiple;
    }
    set multiple(value) {
        this.selectionModel.multiple = value;
        if (this.options) {
            this._updateInternalValue();
        }
    }
    /** Whether the listbox is disabled. */
    get disabled() {
        return this._disabled();
    }
    set disabled(value) {
        this._disabled.set(value);
    }
    /** Whether the listbox will use active descendant or will move focus onto the options. */
    get useActiveDescendant() {
        return this._useActiveDescendant();
    }
    set useActiveDescendant(value) {
        this._useActiveDescendant.set(value);
    }
    /** The orientation of the listbox. Only affects keyboard interaction, not visual layout. */
    get orientation() {
        return this._orientation;
    }
    set orientation(value) {
        this._orientation = value === 'horizontal' ? 'horizontal' : 'vertical';
        if (value === 'horizontal') {
            this.listKeyManager?.withHorizontalOrientation(this._dir?.value || 'ltr');
        }
        else {
            this.listKeyManager?.withVerticalOrientation();
        }
    }
    /** The function used to compare option values. */
    get compareWith() {
        return this.selectionModel.compareWith;
    }
    set compareWith(fn) {
        this.selectionModel.compareWith = fn;
    }
    /**
     * Whether the keyboard navigation should wrap when the user presses arrow down on the last item
     * or arrow up on the first item.
     */
    get navigationWrapDisabled() {
        return this._navigationWrapDisabled;
    }
    set navigationWrapDisabled(wrap) {
        this._navigationWrapDisabled = wrap;
        this.listKeyManager?.withWrap(!this._navigationWrapDisabled);
    }
    /** Whether keyboard navigation should skip over disabled items. */
    get navigateDisabledOptions() {
        return this._navigateDisabledOptions;
    }
    set navigateDisabledOptions(skip) {
        this._navigateDisabledOptions = skip;
        this.listKeyManager?.skipPredicate(this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate);
    }
    constructor() {
        this._generatedId = `cdk-listbox-${nextId++}`;
        this._enabledTabIndex = signal(undefined);
        this._disabled = signal(false);
        this._useActiveDescendant = signal(false);
        this._orientation = 'vertical';
        this._navigationWrapDisabled = false;
        this._navigateDisabledOptions = false;
        /** Emits when the selected value(s) in the listbox change. */
        this.valueChange = new Subject();
        /** The selection model used by the listbox. */
        this.selectionModel = new ListboxSelectionModel();
        /** Emits when the listbox is destroyed. */
        this.destroyed = new Subject();
        /** The host element of the listbox. */
        this.element = inject(ElementRef).nativeElement;
        /** The Angular zone. */
        this.ngZone = inject(NgZone);
        /** The change detector for this listbox. */
        this.changeDetectorRef = inject(ChangeDetectorRef);
        /** Whether the currently selected value in the selection model is invalid. */
        this._invalid = false;
        /** The last user-triggered option. */
        this._lastTriggered = null;
        /** Callback called when the listbox has been touched */
        this._onTouched = () => { };
        /** Callback called when the listbox value changes */
        this._onChange = () => { };
        /** Emits when an option has been clicked. */
        this._optionClicked = defer(() => this.options.changes.pipe(startWith(this.options), switchMap(options => merge(...options.map(option => option._clicked.pipe(map(event => ({ option, event }))))))));
        /** The directionality of the page. */
        this._dir = inject(Directionality, { optional: true });
        /** Whether the component is being rendered in the browser. */
        this._isBrowser = inject(Platform).isBrowser;
        /** A predicate that skips disabled options. */
        this._skipDisabledPredicate = (option) => option.disabled;
        /** A predicate that does not skip any options. */
        this._skipNonePredicate = () => false;
        /** Whether the listbox currently has focus. */
        this._hasFocus = false;
        /** A reference to the option that was active before the listbox lost focus. */
        this._previousActiveOption = null;
        if (this._isBrowser) {
            this._setPreviousActiveOptionAsActiveOptionOnWindowBlur();
        }
    }
    ngAfterContentInit() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            this._verifyNoOptionValueCollisions();
            this._verifyOptionValues();
        }
        this._initKeyManager();
        // Update the internal value whenever the options or the model value changes.
        merge(this.selectionModel.changed, this.options.changes)
            .pipe(startWith(null), takeUntil(this.destroyed))
            .subscribe(() => this._updateInternalValue());
        this._optionClicked
            .pipe(filter(({ option }) => !option.disabled), takeUntil(this.destroyed))
            .subscribe(({ option, event }) => this._handleOptionClicked(option, event));
    }
    ngOnDestroy() {
        this.listKeyManager?.destroy();
        this.destroyed.next();
        this.destroyed.complete();
    }
    /**
     * Toggle the selected state of the given option.
     * @param option The option to toggle
     */
    toggle(option) {
        this.toggleValue(option.value);
    }
    /**
     * Toggle the selected state of the given value.
     * @param value The value to toggle
     */
    toggleValue(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.toggle(value);
    }
    /**
     * Select the given option.
     * @param option The option to select
     */
    select(option) {
        this.selectValue(option.value);
    }
    /**
     * Select the given value.
     * @param value The value to select
     */
    selectValue(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.select(value);
    }
    /**
     * Deselect the given option.
     * @param option The option to deselect
     */
    deselect(option) {
        this.deselectValue(option.value);
    }
    /**
     * Deselect the given value.
     * @param value The value to deselect
     */
    deselectValue(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.deselect(value);
    }
    /**
     * Set the selected state of all options.
     * @param isSelected The new selected state to set
     */
    setAllSelected(isSelected) {
        if (!isSelected) {
            this.selectionModel.clear();
        }
        else {
            if (this._invalid) {
                this.selectionModel.clear(false);
            }
            this.selectionModel.select(...this.options.map(option => option.value));
        }
    }
    /**
     * Get whether the given option is selected.
     * @param option The option to get the selected state of
     */
    isSelected(option) {
        return this.isValueSelected(option.value);
    }
    /**
     * Get whether the given option is active.
     * @param option The option to get the active state of
     */
    isActive(option) {
        return !!(this.listKeyManager?.activeItem === option);
    }
    /**
     * Get whether the given value is selected.
     * @param value The value to get the selected state of
     */
    isValueSelected(value) {
        if (this._invalid) {
            return false;
        }
        return this.selectionModel.isSelected(value);
    }
    /**
     * Registers a callback to be invoked when the listbox's value changes from user input.
     * @param fn The callback to register
     * @docs-private
     */
    registerOnChange(fn) {
        this._onChange = fn;
    }
    /**
     * Registers a callback to be invoked when the listbox is blurred by the user.
     * @param fn The callback to register
     * @docs-private
     */
    registerOnTouched(fn) {
        this._onTouched = fn;
    }
    /**
     * Sets the listbox's value.
     * @param value The new value of the listbox
     * @docs-private
     */
    writeValue(value) {
        this._setSelection(value);
        this._verifyOptionValues();
    }
    /**
     * Sets the disabled state of the listbox.
     * @param isDisabled The new disabled state
     * @docs-private
     */
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
        this.changeDetectorRef.markForCheck();
    }
    /** Focus the listbox's host element. */
    focus() {
        this.element.focus();
    }
    /**
     * Triggers the given option in response to user interaction.
     * - In single selection mode: selects the option and deselects any other selected option.
     * - In multi selection mode: toggles the selected state of the option.
     * @param option The option to trigger
     */
    triggerOption(option) {
        if (option && !option.disabled) {
            this._lastTriggered = option;
            const changed = this.multiple
                ? this.selectionModel.toggle(option.value)
                : this.selectionModel.select(option.value);
            if (changed) {
                this._onChange(this.value);
                this.valueChange.next({
                    value: this.value,
                    listbox: this,
                    option: option,
                });
            }
        }
    }
    /**
     * Trigger the given range of options in response to user interaction.
     * Should only be called in multi-selection mode.
     * @param trigger The option that was triggered
     * @param from The start index of the options to toggle
     * @param to The end index of the options to toggle
     * @param on Whether to toggle the option range on
     */
    triggerRange(trigger, from, to, on) {
        if (this.disabled || (trigger && trigger.disabled)) {
            return;
        }
        this._lastTriggered = trigger;
        const isEqual = this.compareWith ?? Object.is;
        const updateValues = [...this.options]
            .slice(Math.max(0, Math.min(from, to)), Math.min(this.options.length, Math.max(from, to) + 1))
            .filter(option => !option.disabled)
            .map(option => option.value);
        const selected = [...this.value];
        for (const updateValue of updateValues) {
            const selectedIndex = selected.findIndex(selectedValue => isEqual(selectedValue, updateValue));
            if (on && selectedIndex === -1) {
                selected.push(updateValue);
            }
            else if (!on && selectedIndex !== -1) {
                selected.splice(selectedIndex, 1);
            }
        }
        let changed = this.selectionModel.setSelection(...selected);
        if (changed) {
            this._onChange(this.value);
            this.valueChange.next({
                value: this.value,
                listbox: this,
                option: trigger,
            });
        }
    }
    /**
     * Sets the given option as active.
     * @param option The option to make active
     */
    _setActiveOption(option) {
        this.listKeyManager.setActiveItem(option);
    }
    /** Called when the listbox receives focus. */
    _handleFocus() {
        if (!this.useActiveDescendant) {
            if (this.selectionModel.selected.length > 0) {
                this._setNextFocusToSelectedOption();
            }
            else {
                this.listKeyManager.setNextItemActive();
            }
            this._focusActiveOption();
        }
    }
    /** Called when the user presses keydown on the listbox. */
    _handleKeydown(event) {
        if (this.disabled) {
            return;
        }
        const { keyCode } = event;
        const previousActiveIndex = this.listKeyManager.activeItemIndex;
        const ctrlKeys = ['ctrlKey', 'metaKey'];
        if (this.multiple && keyCode === A && hasModifierKey(event, ...ctrlKeys)) {
            // Toggle all options off if they're all selected, otherwise toggle them all on.
            this.triggerRange(null, 0, this.options.length - 1, this.options.length !== this.value.length);
            event.preventDefault();
            return;
        }
        if (this.multiple &&
            (keyCode === SPACE || keyCode === ENTER) &&
            hasModifierKey(event, 'shiftKey')) {
            if (this.listKeyManager.activeItem && this.listKeyManager.activeItemIndex != null) {
                this.triggerRange(this.listKeyManager.activeItem, this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex, this.listKeyManager.activeItemIndex, !this.listKeyManager.activeItem.isSelected());
            }
            event.preventDefault();
            return;
        }
        if (this.multiple &&
            keyCode === HOME &&
            hasModifierKey(event, ...ctrlKeys) &&
            hasModifierKey(event, 'shiftKey')) {
            const trigger = this.listKeyManager.activeItem;
            if (trigger) {
                const from = this.listKeyManager.activeItemIndex;
                this.listKeyManager.setFirstItemActive();
                this.triggerRange(trigger, from, this.listKeyManager.activeItemIndex, !trigger.isSelected());
            }
            event.preventDefault();
            return;
        }
        if (this.multiple &&
            keyCode === END &&
            hasModifierKey(event, ...ctrlKeys) &&
            hasModifierKey(event, 'shiftKey')) {
            const trigger = this.listKeyManager.activeItem;
            if (trigger) {
                const from = this.listKeyManager.activeItemIndex;
                this.listKeyManager.setLastItemActive();
                this.triggerRange(trigger, from, this.listKeyManager.activeItemIndex, !trigger.isSelected());
            }
            event.preventDefault();
            return;
        }
        if (keyCode === SPACE || keyCode === ENTER) {
            this.triggerOption(this.listKeyManager.activeItem);
            event.preventDefault();
            return;
        }
        const isNavKey = keyCode === UP_ARROW ||
            keyCode === DOWN_ARROW ||
            keyCode === LEFT_ARROW ||
            keyCode === RIGHT_ARROW ||
            keyCode === HOME ||
            keyCode === END;
        this.listKeyManager.onKeydown(event);
        // Will select an option if shift was pressed while navigating to the option
        if (isNavKey && event.shiftKey && previousActiveIndex !== this.listKeyManager.activeItemIndex) {
            this.triggerOption(this.listKeyManager.activeItem);
        }
    }
    /** Called when a focus moves into the listbox. */
    _handleFocusIn() {
        // Note that we use a `focusin` handler for this instead of the existing `focus` handler,
        // because focus won't land on the listbox if `useActiveDescendant` is enabled.
        this._hasFocus = true;
    }
    /**
     * Called when the focus leaves an element in the listbox.
     * @param event The focusout event
     */
    _handleFocusOut(event) {
        // Some browsers (e.g. Chrome and Firefox) trigger the focusout event when the user returns back to the document.
        // To prevent losing the active option in this case, we store it in `_previousActiveOption` and restore it on the window `blur` event
        // This ensures that the `activeItem` matches the actual focused element when the user returns to the document.
        this._previousActiveOption = this.listKeyManager.activeItem;
        const otherElement = event.relatedTarget;
        if (this.element !== otherElement && !this.element.contains(otherElement)) {
            this._onTouched();
            this._hasFocus = false;
            this._setNextFocusToSelectedOption();
        }
    }
    /** Get the id of the active option if active descendant is being used. */
    _getAriaActiveDescendant() {
        return this.useActiveDescendant ? this.listKeyManager?.activeItem?.id : null;
    }
    /** Get the tabindex for the listbox. */
    _getTabIndex() {
        if (this.disabled) {
            return -1;
        }
        return this.useActiveDescendant || !this.listKeyManager.activeItem ? this.enabledTabIndex : -1;
    }
    /** Initialize the key manager. */
    _initKeyManager() {
        this.listKeyManager = new ActiveDescendantKeyManager(this.options)
            .withWrap(!this._navigationWrapDisabled)
            .withTypeAhead()
            .withHomeAndEnd()
            .withAllowedModifierKeys(['shiftKey'])
            .skipPredicate(this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate);
        if (this.orientation === 'vertical') {
            this.listKeyManager.withVerticalOrientation();
        }
        else {
            this.listKeyManager.withHorizontalOrientation(this._dir?.value || 'ltr');
        }
        if (this.selectionModel.selected.length) {
            Promise.resolve().then(() => this._setNextFocusToSelectedOption());
        }
        this.listKeyManager.change.subscribe(() => this._focusActiveOption());
        this.options.changes.pipe(takeUntil(this.destroyed)).subscribe(() => {
            const activeOption = this.listKeyManager.activeItem;
            // If the active option was deleted, we need to reset
            // the key manager so it can allow focus back in.
            if (activeOption && !this.options.find(option => option === activeOption)) {
                this.listKeyManager.setActiveItem(-1);
                this.changeDetectorRef.markForCheck();
            }
        });
    }
    /** Focus the active option. */
    _focusActiveOption() {
        if (!this.useActiveDescendant) {
            this.listKeyManager.activeItem?.focus();
        }
        this.changeDetectorRef.markForCheck();
    }
    /**
     * Set the selected values.
     * @param value The list of new selected values.
     */
    _setSelection(value) {
        if (this._invalid) {
            this.selectionModel.clear(false);
        }
        this.selectionModel.setSelection(...this._coerceValue(value));
        if (!this._hasFocus) {
            this._setNextFocusToSelectedOption();
        }
    }
    /** Sets the first selected option as first in the keyboard focus order. */
    _setNextFocusToSelectedOption() {
        // Null check the options since they only get defined after `ngAfterContentInit`.
        const selected = this.options?.find(option => option.isSelected());
        if (selected) {
            this.listKeyManager.updateActiveItem(selected);
        }
    }
    /** Update the internal value of the listbox based on the selection model. */
    _updateInternalValue() {
        const indexCache = new Map();
        this.selectionModel.sort((a, b) => {
            const aIndex = this._getIndexForValue(indexCache, a);
            const bIndex = this._getIndexForValue(indexCache, b);
            return aIndex - bIndex;
        });
        const selected = this.selectionModel.selected;
        this._invalid =
            (!this.multiple && selected.length > 1) || !!this._getInvalidOptionValues(selected).length;
        this.changeDetectorRef.markForCheck();
    }
    /**
     * Gets the index of the given value in the given list of options.
     * @param cache The cache of indices found so far
     * @param value The value to find
     * @return The index of the value in the options list
     */
    _getIndexForValue(cache, value) {
        const isEqual = this.compareWith || Object.is;
        if (!cache.has(value)) {
            let index = -1;
            for (let i = 0; i < this.options.length; i++) {
                if (isEqual(value, this.options.get(i).value)) {
                    index = i;
                    break;
                }
            }
            cache.set(value, index);
        }
        return cache.get(value);
    }
    /**
     * Handle the user clicking an option.
     * @param option The option that was clicked.
     */
    _handleOptionClicked(option, event) {
        event.preventDefault();
        this.listKeyManager.setActiveItem(option);
        if (event.shiftKey && this.multiple) {
            this.triggerRange(option, this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex, this.listKeyManager.activeItemIndex, !option.isSelected());
        }
        else {
            this.triggerOption(option);
        }
    }
    /** Verifies that no two options represent the same value under the compareWith function. */
    _verifyNoOptionValueCollisions() {
        this.options.changes.pipe(startWith(this.options), takeUntil(this.destroyed)).subscribe(() => {
            const isEqual = this.compareWith ?? Object.is;
            for (let i = 0; i < this.options.length; i++) {
                const option = this.options.get(i);
                let duplicate = null;
                for (let j = i + 1; j < this.options.length; j++) {
                    const other = this.options.get(j);
                    if (isEqual(option.value, other.value)) {
                        duplicate = other;
                        break;
                    }
                }
                if (duplicate) {
                    // TODO(mmalerba): Link to docs about this.
                    if (this.compareWith) {
                        console.warn(`Found multiple CdkOption representing the same value under the given compareWith function`, {
                            option1: option.element,
                            option2: duplicate.element,
                            compareWith: this.compareWith,
                        });
                    }
                    else {
                        console.warn(`Found multiple CdkOption with the same value`, {
                            option1: option.element,
                            option2: duplicate.element,
                        });
                    }
                    return;
                }
            }
        });
    }
    /** Verifies that the option values are valid. */
    _verifyOptionValues() {
        if (this.options && (typeof ngDevMode === 'undefined' || ngDevMode)) {
            const selected = this.selectionModel.selected;
            const invalidValues = this._getInvalidOptionValues(selected);
            if (!this.multiple && selected.length > 1) {
                throw Error('Listbox cannot have more than one selected value in multi-selection mode.');
            }
            if (invalidValues.length) {
                throw Error('Listbox has selected values that do not match any of its options.');
            }
        }
    }
    /**
     * Coerces a value into an array representing a listbox selection.
     * @param value The value to coerce
     * @return An array
     */
    _coerceValue(value) {
        return value == null ? [] : coerceArray(value);
    }
    /**
     * Get the sublist of values that do not represent valid option values in this listbox.
     * @param values The list of values
     * @return The sublist of values that are not valid option values
     */
    _getInvalidOptionValues(values) {
        const isEqual = this.compareWith || Object.is;
        const validValues = (this.options || []).map(option => option.value);
        return values.filter(value => !validValues.some(validValue => isEqual(value, validValue)));
    }
    /** Get the index of the last triggered option. */
    _getLastTriggeredIndex() {
        const index = this.options.toArray().indexOf(this._lastTriggered);
        return index === -1 ? null : index;
    }
    /**
     * Set previous active option as active option on window blur.
     * This ensures that the `activeOption` matches the actual focused element when the user returns to the document.
     */
    _setPreviousActiveOptionAsActiveOptionOnWindowBlur() {
        this.ngZone.runOutsideAngular(() => {
            fromEvent(window, 'blur')
                .pipe(takeUntil(this.destroyed))
                .subscribe(() => {
                if (this.element.contains(document.activeElement) && this._previousActiveOption) {
                    this._setActiveOption(this._previousActiveOption);
                    this._previousActiveOption = null;
                }
            });
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListbox, deps: [], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "16.1.0", version: "18.2.0-next.2", type: CdkListbox, isStandalone: true, selector: "[cdkListbox]", inputs: { id: "id", enabledTabIndex: ["tabindex", "enabledTabIndex"], value: ["cdkListboxValue", "value"], multiple: ["cdkListboxMultiple", "multiple", booleanAttribute], disabled: ["cdkListboxDisabled", "disabled", booleanAttribute], useActiveDescendant: ["cdkListboxUseActiveDescendant", "useActiveDescendant", booleanAttribute], orientation: ["cdkListboxOrientation", "orientation"], compareWith: ["cdkListboxCompareWith", "compareWith"], navigationWrapDisabled: ["cdkListboxNavigationWrapDisabled", "navigationWrapDisabled", booleanAttribute], navigateDisabledOptions: ["cdkListboxNavigatesDisabledOptions", "navigateDisabledOptions", booleanAttribute] }, outputs: { valueChange: "cdkListboxValueChange" }, host: { attributes: { "role": "listbox" }, listeners: { "focus": "_handleFocus()", "keydown": "_handleKeydown($event)", "focusout": "_handleFocusOut($event)", "focusin": "_handleFocusIn()" }, properties: { "id": "id", "attr.tabindex": "_getTabIndex()", "attr.aria-disabled": "disabled", "attr.aria-multiselectable": "multiple", "attr.aria-activedescendant": "_getAriaActiveDescendant()", "attr.aria-orientation": "orientation" }, classAttribute: "cdk-listbox" }, providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => CdkListbox),
                multi: true,
            },
        ], queries: [{ propertyName: "options", predicate: CdkOption, descendants: true }], exportAs: ["cdkListbox"], ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.2.0-next.2", ngImport: i0, type: CdkListbox, decorators: [{
            type: Directive,
            args: [{
                    selector: '[cdkListbox]',
                    standalone: true,
                    exportAs: 'cdkListbox',
                    host: {
                        'role': 'listbox',
                        'class': 'cdk-listbox',
                        '[id]': 'id',
                        '[attr.tabindex]': '_getTabIndex()',
                        '[attr.aria-disabled]': 'disabled',
                        '[attr.aria-multiselectable]': 'multiple',
                        '[attr.aria-activedescendant]': '_getAriaActiveDescendant()',
                        '[attr.aria-orientation]': 'orientation',
                        '(focus)': '_handleFocus()',
                        '(keydown)': '_handleKeydown($event)',
                        '(focusout)': '_handleFocusOut($event)',
                        '(focusin)': '_handleFocusIn()',
                    },
                    providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef(() => CdkListbox),
                            multi: true,
                        },
                    ],
                }]
        }], ctorParameters: () => [], propDecorators: { id: [{
                type: Input
            }], enabledTabIndex: [{
                type: Input,
                args: ['tabindex']
            }], value: [{
                type: Input,
                args: ['cdkListboxValue']
            }], multiple: [{
                type: Input,
                args: [{ alias: 'cdkListboxMultiple', transform: booleanAttribute }]
            }], disabled: [{
                type: Input,
                args: [{ alias: 'cdkListboxDisabled', transform: booleanAttribute }]
            }], useActiveDescendant: [{
                type: Input,
                args: [{ alias: 'cdkListboxUseActiveDescendant', transform: booleanAttribute }]
            }], orientation: [{
                type: Input,
                args: ['cdkListboxOrientation']
            }], compareWith: [{
                type: Input,
                args: ['cdkListboxCompareWith']
            }], navigationWrapDisabled: [{
                type: Input,
                args: [{ alias: 'cdkListboxNavigationWrapDisabled', transform: booleanAttribute }]
            }], navigateDisabledOptions: [{
                type: Input,
                args: [{ alias: 'cdkListboxNavigatesDisabledOptions', transform: booleanAttribute }]
            }], valueChange: [{
                type: Output,
                args: ['cdkListboxValueChange']
            }], options: [{
                type: ContentChildren,
                args: [CdkOption, { descendants: true }]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGJveC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9jZGsvbGlzdGJveC9saXN0Ym94LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQywwQkFBMEIsRUFBc0MsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2xELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN4RCxPQUFPLEVBQ0wsQ0FBQyxFQUNELFVBQVUsRUFDVixHQUFHLEVBQ0gsS0FBSyxFQUNMLGNBQWMsRUFDZCxJQUFJLEVBQ0osVUFBVSxFQUNWLFdBQVcsRUFDWCxLQUFLLEVBQ0wsUUFBUSxHQUNULE1BQU0sdUJBQXVCLENBQUM7QUFDL0IsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFFTCxnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2pCLGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLFVBQVUsRUFDVixNQUFNLEVBQ04sS0FBSyxFQUNMLE1BQU0sRUFHTixNQUFNLEVBQ04sU0FBUyxFQUNULE1BQU0sRUFDTixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUF1QixpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBYyxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDbEUsT0FBTyxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7QUFFNUUsc0RBQXNEO0FBQ3RELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLHFCQUF5QixTQUFRLGNBQWlCO0lBQ3RELFlBQ1MsV0FBVyxLQUFLLEVBQ3ZCLHVCQUE2QixFQUM3QixXQUFXLEdBQUcsSUFBSSxFQUNsQixXQUF1QztRQUV2QyxLQUFLLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUx4RCxhQUFRLEdBQVIsUUFBUSxDQUFRO0lBTXpCLENBQUM7SUFFUSxtQkFBbUI7UUFDMUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7SUFFUSxNQUFNLENBQUMsR0FBRyxNQUFXO1FBQzVCLDRGQUE0RjtRQUM1Rix1RUFBdUU7UUFDdkUsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDakMsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsd0NBQXdDO0FBaUJ4QyxNQUFNLE9BQU8sU0FBUztJQWhCdEI7UUE0QlUsaUJBQVksR0FBRyxjQUFjLE1BQU0sRUFBRSxFQUFFLENBQUM7UUFtQnhDLGNBQVMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFZMUIscUJBQWdCLEdBQUcsTUFBTSxDQUE0QixTQUFTLENBQUMsQ0FBQztRQUV4RSxnQ0FBZ0M7UUFDdkIsWUFBTyxHQUFnQixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsYUFBYSxDQUFDO1FBRWpFLGlEQUFpRDtRQUM5QixZQUFPLEdBQWtCLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUvRCx1REFBdUQ7UUFDcEMsYUFBUSxHQUFjLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUUzRCwwQ0FBMEM7UUFDaEMsY0FBUyxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFFMUMsd0NBQXdDO1FBQy9CLGFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBYyxDQUFDO0tBa0YvQztJQXpJQywyQ0FBMkM7SUFDM0MsSUFDSSxFQUFFO1FBQ0osT0FBTyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDdkMsQ0FBQztJQUNELElBQUksRUFBRSxDQUFDLEtBQUs7UUFDVixJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNuQixDQUFDO0lBYUQsdUNBQXVDO0lBQ3ZDLElBQ0ksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ25ELENBQUM7SUFDRCxJQUFJLFFBQVEsQ0FBQyxLQUFjO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFHRCxxREFBcUQ7SUFDckQsSUFDSSxlQUFlO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixFQUFFLEtBQUssU0FBUztZQUMxQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlO1lBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBQ0QsSUFBSSxlQUFlLENBQUMsS0FBSztRQUN2QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFrQkQsUUFBUTtRQUNOLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsdUNBQXVDO0lBQ3ZDLFVBQVU7UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxxQ0FBcUM7SUFDckMsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxNQUFNO1FBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxNQUFNO1FBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELDhDQUE4QztJQUM5QyxRQUFRO1FBQ04sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELHlCQUF5QjtJQUN6QixLQUFLO1FBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQseUZBQXlGO0lBQ3pGLFFBQVE7UUFDTixPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN6RSxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZUFBZTtRQUNiLHFGQUFxRjtRQUNyRixtRkFBbUY7UUFDbkYsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsaUJBQWlCLEtBQUksQ0FBQztJQUV0Qix5Q0FBeUM7SUFDL0IsWUFBWTtRQUNwQiw0RkFBNEY7UUFDNUYsMkZBQTJGO1FBQzNGLGlDQUFpQztRQUNqQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsQ0FBQztJQUNILENBQUM7SUFFRCx3Q0FBd0M7SUFDOUIsWUFBWTtRQUNwQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3RELE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDWixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7cUhBM0lVLFNBQVM7eUdBQVQsU0FBUyw2TUF3QjJCLGdCQUFnQjs7a0dBeEJwRCxTQUFTO2tCQWhCckIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsYUFBYTtvQkFDdkIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFFBQVEsRUFBRSxXQUFXO29CQUNyQixJQUFJLEVBQUU7d0JBQ0osTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLE9BQU8sRUFBRSxZQUFZO3dCQUNyQixNQUFNLEVBQUUsSUFBSTt3QkFDWixzQkFBc0IsRUFBRSxjQUFjO3dCQUN0QyxpQkFBaUIsRUFBRSxnQkFBZ0I7d0JBQ25DLHNCQUFzQixFQUFFLFVBQVU7d0JBQ2xDLDJCQUEyQixFQUFFLFlBQVk7d0JBQ3pDLFNBQVMsRUFBRSx1QkFBdUI7d0JBQ2xDLFNBQVMsRUFBRSxnQkFBZ0I7cUJBQzVCO2lCQUNGOzhCQU1LLEVBQUU7c0JBREwsS0FBSztnQkFXYyxLQUFLO3NCQUF4QixLQUFLO3VCQUFDLFdBQVc7Z0JBTWdCLGNBQWM7c0JBQS9DLEtBQUs7dUJBQUMseUJBQXlCO2dCQUk1QixRQUFRO3NCQURYLEtBQUs7dUJBQUMsRUFBQyxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFDO2dCQVc1RCxlQUFlO3NCQURsQixLQUFLO3VCQUFDLFVBQVU7O0FBc0luQixNQUFNLE9BQU8sVUFBVTtJQUNyQiwyQ0FBMkM7SUFDM0MsSUFDSSxFQUFFO1FBQ0osT0FBTyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDdkMsQ0FBQztJQUNELElBQUksRUFBRSxDQUFDLEtBQUs7UUFDVixJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNuQixDQUFDO0lBSUQsdURBQXVEO0lBQ3ZELElBQ0ksZUFBZTtRQUNqQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM3RSxDQUFDO0lBQ0QsSUFBSSxlQUFlLENBQUMsS0FBSztRQUN2QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFHRCxtRkFBbUY7SUFDbkYsSUFDSSxLQUFLO1FBQ1AsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO0lBQzNELENBQUM7SUFDRCxJQUFJLEtBQUssQ0FBQyxLQUFtQjtRQUMzQixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUNJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO0lBQ3RDLENBQUM7SUFDRCxJQUFJLFFBQVEsQ0FBQyxLQUFjO1FBQ3pCLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUVyQyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM5QixDQUFDO0lBQ0gsQ0FBQztJQUVELHVDQUF1QztJQUN2QyxJQUNJLFFBQVE7UUFDVixPQUFPLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBQ0QsSUFBSSxRQUFRLENBQUMsS0FBYztRQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBR0QsMEZBQTBGO0lBQzFGLElBQ0ksbUJBQW1CO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7SUFDckMsQ0FBQztJQUNELElBQUksbUJBQW1CLENBQUMsS0FBYztRQUNwQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFHRCw0RkFBNEY7SUFDNUYsSUFDSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQzNCLENBQUM7SUFDRCxJQUFJLFdBQVcsQ0FBQyxLQUFnQztRQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssS0FBSyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQ3ZFLElBQUksS0FBSyxLQUFLLFlBQVksRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxjQUFjLEVBQUUseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLElBQUksS0FBSyxDQUFDLENBQUM7UUFDNUUsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsY0FBYyxFQUFFLHVCQUF1QixFQUFFLENBQUM7UUFDakQsQ0FBQztJQUNILENBQUM7SUFHRCxrREFBa0Q7SUFDbEQsSUFDSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQztJQUN6QyxDQUFDO0lBQ0QsSUFBSSxXQUFXLENBQUMsRUFBMkM7UUFDekQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUNJLHNCQUFzQjtRQUN4QixPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsSUFBSSxzQkFBc0IsQ0FBQyxJQUFhO1FBQ3RDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7UUFDcEMsSUFBSSxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBR0QsbUVBQW1FO0lBQ25FLElBQ0ksdUJBQXVCO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDO0lBQ3ZDLENBQUM7SUFDRCxJQUFJLHVCQUF1QixDQUFDLElBQWE7UUFDdkMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQztRQUNyQyxJQUFJLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FDaEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FDdEYsQ0FBQztJQUNKLENBQUM7SUFtRUQ7UUE1S1EsaUJBQVksR0FBRyxlQUFlLE1BQU0sRUFBRSxFQUFFLENBQUM7UUFVekMscUJBQWdCLEdBQUcsTUFBTSxDQUE0QixTQUFTLENBQUMsQ0FBQztRQW1DaEUsY0FBUyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQVUxQix5QkFBb0IsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFlckMsaUJBQVksR0FBOEIsVUFBVSxDQUFDO1FBdUJyRCw0QkFBdUIsR0FBRyxLQUFLLENBQUM7UUFhaEMsNkJBQXdCLEdBQUcsS0FBSyxDQUFDO1FBRXpDLDhEQUE4RDtRQUNwQixnQkFBVyxHQUFHLElBQUksT0FBTyxFQUE4QixDQUFDO1FBS2xHLCtDQUErQztRQUNyQyxtQkFBYyxHQUFHLElBQUkscUJBQXFCLEVBQUssQ0FBQztRQUsxRCwyQ0FBMkM7UUFDeEIsY0FBUyxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFFbkQsdUNBQXVDO1FBQ3BCLFlBQU8sR0FBZ0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGFBQWEsQ0FBQztRQUUzRSx3QkFBd0I7UUFDTCxXQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTNDLDRDQUE0QztRQUN6QixzQkFBaUIsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUVqRSw4RUFBOEU7UUFDdEUsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUV6QixzQ0FBc0M7UUFDOUIsbUJBQWMsR0FBd0IsSUFBSSxDQUFDO1FBRW5ELHdEQUF3RDtRQUNoRCxlQUFVLEdBQUcsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDO1FBRTlCLHFEQUFxRDtRQUM3QyxjQUFTLEdBQWtDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQztRQUU1RCw2Q0FBNkM7UUFDckMsbUJBQWMsR0FBRyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBc0MsQ0FBQyxJQUFJLENBQ3ZELFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQ3ZCLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUNsQixLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQ3ZGLENBQ0YsQ0FDRixDQUFDO1FBRUYsc0NBQXNDO1FBQ3JCLFNBQUksR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFFakUsOERBQThEO1FBQzdDLGVBQVUsR0FBWSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDO1FBRWxFLCtDQUErQztRQUM5QiwyQkFBc0IsR0FBRyxDQUFDLE1BQW9CLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFFcEYsa0RBQWtEO1FBQ2pDLHVCQUFrQixHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztRQUVsRCwrQ0FBK0M7UUFDdkMsY0FBUyxHQUFHLEtBQUssQ0FBQztRQUUxQiwrRUFBK0U7UUFDdkUsMEJBQXFCLEdBQXdCLElBQUksQ0FBQztRQUd4RCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsa0RBQWtELEVBQUUsQ0FBQztRQUM1RCxDQUFDO0lBQ0gsQ0FBQztJQUVELGtCQUFrQjtRQUNoQixJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNsRCxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBRUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXZCLDZFQUE2RTtRQUM3RSxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7YUFDckQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ2hELFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxjQUFjO2FBQ2hCLElBQUksQ0FDSCxNQUFNLENBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFDdEMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FDMUI7YUFDQSxTQUFTLENBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzlFLENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILE1BQU0sQ0FBQyxNQUFvQjtRQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsV0FBVyxDQUFDLEtBQVE7UUFDbEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMsTUFBb0I7UUFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7T0FHRztJQUNILFdBQVcsQ0FBQyxLQUFRO1FBQ2xCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLE1BQW9CO1FBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7O09BR0c7SUFDSCxhQUFhLENBQUMsS0FBUTtRQUNwQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILGNBQWMsQ0FBQyxVQUFtQjtRQUNoQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsVUFBVSxDQUFDLE1BQW9CO1FBQzdCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7T0FHRztJQUNILFFBQVEsQ0FBQyxNQUFvQjtRQUMzQixPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBVSxLQUFLLE1BQU0sQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRDs7O09BR0c7SUFDSCxlQUFlLENBQUMsS0FBUTtRQUN0QixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsZ0JBQWdCLENBQUMsRUFBaUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxpQkFBaUIsQ0FBQyxFQUFZO1FBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsVUFBVSxDQUFDLEtBQW1CO1FBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxnQkFBZ0IsQ0FBQyxVQUFtQjtRQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztRQUMzQixJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVELHdDQUF3QztJQUN4QyxLQUFLO1FBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDTyxhQUFhLENBQUMsTUFBMkI7UUFDakQsSUFBSSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7WUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVE7Z0JBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUMxQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO29CQUNwQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7b0JBQ2pCLE9BQU8sRUFBRSxJQUFJO29CQUNiLE1BQU0sRUFBRSxNQUFNO2lCQUNmLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDTyxZQUFZLENBQUMsT0FBNEIsRUFBRSxJQUFZLEVBQUUsRUFBVSxFQUFFLEVBQVc7UUFDeEYsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ25ELE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUM7UUFDOUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzlDLE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO2FBQ25DLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDN0YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO2FBQ2xDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLEtBQUssTUFBTSxXQUFXLElBQUksWUFBWSxFQUFFLENBQUM7WUFDdkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUN2RCxPQUFPLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUNwQyxDQUFDO1lBQ0YsSUFBSSxFQUFFLElBQUksYUFBYSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDN0IsQ0FBQztpQkFBTSxJQUFJLENBQUMsRUFBRSxJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN2QyxRQUFRLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7UUFDNUQsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO2dCQUNwQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE1BQU0sRUFBRSxPQUFPO2FBQ2hCLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZ0JBQWdCLENBQUMsTUFBb0I7UUFDbkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELDhDQUE4QztJQUNwQyxZQUFZO1FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM5QixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFDdkMsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMxQyxDQUFDO1lBRUQsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDNUIsQ0FBQztJQUNILENBQUM7SUFFRCwyREFBMkQ7SUFDakQsY0FBYyxDQUFDLEtBQW9CO1FBQzNDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLE9BQU87UUFDVCxDQUFDO1FBRUQsTUFBTSxFQUFDLE9BQU8sRUFBQyxHQUFHLEtBQUssQ0FBQztRQUN4QixNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO1FBQ2hFLE1BQU0sUUFBUSxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBVSxDQUFDO1FBRWpELElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ3pFLGdGQUFnRjtZQUNoRixJQUFJLENBQUMsWUFBWSxDQUNmLElBQUksRUFDSixDQUFDLEVBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FDMUMsQ0FBQztZQUNGLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQ0UsSUFBSSxDQUFDLFFBQVE7WUFDYixDQUFDLE9BQU8sS0FBSyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssQ0FBQztZQUN4QyxjQUFjLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxFQUNqQyxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDbEYsSUFBSSxDQUFDLFlBQVksQ0FDZixJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFDOUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLEVBQ3BFLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUNuQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUM3QyxDQUFDO1lBQ0osQ0FBQztZQUNELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixPQUFPO1FBQ1QsQ0FBQztRQUVELElBQ0UsSUFBSSxDQUFDLFFBQVE7WUFDYixPQUFPLEtBQUssSUFBSTtZQUNoQixjQUFjLENBQUMsS0FBSyxFQUFFLEdBQUcsUUFBUSxDQUFDO1lBQ2xDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEVBQ2pDLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztZQUMvQyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZ0IsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsWUFBWSxDQUNmLE9BQU8sRUFDUCxJQUFJLEVBQ0osSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFnQixFQUNwQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FDdEIsQ0FBQztZQUNKLENBQUM7WUFDRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsT0FBTztRQUNULENBQUM7UUFFRCxJQUNFLElBQUksQ0FBQyxRQUFRO1lBQ2IsT0FBTyxLQUFLLEdBQUc7WUFDZixjQUFjLENBQUMsS0FBSyxFQUFFLEdBQUcsUUFBUSxDQUFDO1lBQ2xDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEVBQ2pDLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztZQUMvQyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNaLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZ0IsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsWUFBWSxDQUNmLE9BQU8sRUFDUCxJQUFJLEVBQ0osSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFnQixFQUNwQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FDdEIsQ0FBQztZQUNKLENBQUM7WUFDRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdkIsT0FBTztRQUNULENBQUM7UUFFRCxNQUFNLFFBQVEsR0FDWixPQUFPLEtBQUssUUFBUTtZQUNwQixPQUFPLEtBQUssVUFBVTtZQUN0QixPQUFPLEtBQUssVUFBVTtZQUN0QixPQUFPLEtBQUssV0FBVztZQUN2QixPQUFPLEtBQUssSUFBSTtZQUNoQixPQUFPLEtBQUssR0FBRyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLDRFQUE0RTtRQUM1RSxJQUFJLFFBQVEsSUFBSSxLQUFLLENBQUMsUUFBUSxJQUFJLG1CQUFtQixLQUFLLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDOUYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JELENBQUM7SUFDSCxDQUFDO0lBRUQsa0RBQWtEO0lBQ3hDLGNBQWM7UUFDdEIseUZBQXlGO1FBQ3pGLCtFQUErRTtRQUMvRSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztJQUN4QixDQUFDO0lBRUQ7OztPQUdHO0lBQ08sZUFBZSxDQUFDLEtBQWlCO1FBQ3pDLGlIQUFpSDtRQUNqSCxxSUFBcUk7UUFDckksK0dBQStHO1FBQy9HLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztRQUU1RCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsYUFBd0IsQ0FBQztRQUNwRCxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUMxRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDdkMsQ0FBQztJQUNILENBQUM7SUFFRCwwRUFBMEU7SUFDaEUsd0JBQXdCO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUMvRSxDQUFDO0lBRUQsd0NBQXdDO0lBQzlCLFlBQVk7UUFDcEIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEIsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNaLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqRyxDQUFDO0lBRUQsa0NBQWtDO0lBQzFCLGVBQWU7UUFDckIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDBCQUEwQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7YUFDL0QsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDO2FBQ3ZDLGFBQWEsRUFBRTthQUNmLGNBQWMsRUFBRTthQUNoQix1QkFBdUIsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3JDLGFBQWEsQ0FDWixJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUN0RixDQUFDO1FBRUosSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxjQUFjLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNoRCxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLElBQUksS0FBSyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDeEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQztRQUV0RSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7WUFFcEQscURBQXFEO1lBQ3JELGlEQUFpRDtZQUNqRCxJQUFJLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxLQUFLLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0JBQzFFLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN4QyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsK0JBQStCO0lBQ3ZCLGtCQUFrQjtRQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDMUMsQ0FBQztRQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssYUFBYSxDQUFDLEtBQW1CO1FBQ3ZDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUU5RCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7SUFDSCxDQUFDO0lBRUQsMkVBQTJFO0lBQ25FLDZCQUE2QjtRQUNuQyxpRkFBaUY7UUFDakYsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUVuRSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRCxDQUFDO0lBQ0gsQ0FBQztJQUVELDZFQUE2RTtJQUNyRSxvQkFBb0I7UUFDMUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQWEsQ0FBQztRQUN4QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUksRUFBRSxDQUFJLEVBQUUsRUFBRTtZQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckQsT0FBTyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUM7UUFDOUMsSUFBSSxDQUFDLFFBQVE7WUFDWCxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzdGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxpQkFBaUIsQ0FBQyxLQUFxQixFQUFFLEtBQVE7UUFDdkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzlDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQy9DLEtBQUssR0FBRyxDQUFDLENBQUM7b0JBQ1YsTUFBTTtnQkFDUixDQUFDO1lBQ0gsQ0FBQztZQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNLLG9CQUFvQixDQUFDLE1BQW9CLEVBQUUsS0FBaUI7UUFDbEUsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLFlBQVksQ0FDZixNQUFNLEVBQ04sSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFnQixFQUNyRSxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWdCLEVBQ3BDLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUNyQixDQUFDO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0lBRUQsNEZBQTRGO0lBQ3BGLDhCQUE4QjtRQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUMzRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDOUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDO2dCQUNwQyxJQUFJLFNBQVMsR0FBd0IsSUFBSSxDQUFDO2dCQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ2pELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxDQUFDO29CQUNuQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN2QyxTQUFTLEdBQUcsS0FBSyxDQUFDO3dCQUNsQixNQUFNO29CQUNSLENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNkLDJDQUEyQztvQkFDM0MsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQ1YsMkZBQTJGLEVBQzNGOzRCQUNFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTzs0QkFDdkIsT0FBTyxFQUFFLFNBQVMsQ0FBQyxPQUFPOzRCQUMxQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7eUJBQzlCLENBQ0YsQ0FBQztvQkFDSixDQUFDO3lCQUFNLENBQUM7d0JBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsRUFBRTs0QkFDM0QsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPOzRCQUN2QixPQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU87eUJBQzNCLENBQUMsQ0FBQztvQkFDTCxDQUFDO29CQUNELE9BQU87Z0JBQ1QsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxpREFBaUQ7SUFDekMsbUJBQW1CO1FBQ3pCLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQ3BFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO1lBQzlDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU3RCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLEtBQUssQ0FBQywyRUFBMkUsQ0FBQyxDQUFDO1lBQzNGLENBQUM7WUFFRCxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxLQUFLLENBQUMsbUVBQW1FLENBQUMsQ0FBQztZQUNuRixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssWUFBWSxDQUFDLEtBQW1CO1FBQ3RDLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyx1QkFBdUIsQ0FBQyxNQUFvQjtRQUNsRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDOUMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDO0lBRUQsa0RBQWtEO0lBQzFDLHNCQUFzQjtRQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBZSxDQUFDLENBQUM7UUFDbkUsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7O09BR0c7SUFDSyxrREFBa0Q7UUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDakMsU0FBUyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUM7aUJBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUMvQixTQUFTLENBQUMsR0FBRyxFQUFFO2dCQUNkLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUNoRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7b0JBQ2xELElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7Z0JBQ3BDLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztxSEE1eEJVLFVBQVU7eUdBQVYsVUFBVSx3TUFtQzJCLGdCQUFnQixnREFhaEIsZ0JBQWdCLGlGQVVMLGdCQUFnQix3TUFxQ2IsZ0JBQWdCLDhGQVdkLGdCQUFnQixraEJBbEhyRTtZQUNUO2dCQUNFLE9BQU8sRUFBRSxpQkFBaUI7Z0JBQzFCLFdBQVcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDO2dCQUN6QyxLQUFLLEVBQUUsSUFBSTthQUNaO1NBQ0Ysa0RBNEhnQixTQUFTOztrR0ExSGYsVUFBVTtrQkExQnRCLFNBQVM7bUJBQUM7b0JBQ1QsUUFBUSxFQUFFLGNBQWM7b0JBQ3hCLFVBQVUsRUFBRSxJQUFJO29CQUNoQixRQUFRLEVBQUUsWUFBWTtvQkFDdEIsSUFBSSxFQUFFO3dCQUNKLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixPQUFPLEVBQUUsYUFBYTt3QkFDdEIsTUFBTSxFQUFFLElBQUk7d0JBQ1osaUJBQWlCLEVBQUUsZ0JBQWdCO3dCQUNuQyxzQkFBc0IsRUFBRSxVQUFVO3dCQUNsQyw2QkFBNkIsRUFBRSxVQUFVO3dCQUN6Qyw4QkFBOEIsRUFBRSw0QkFBNEI7d0JBQzVELHlCQUF5QixFQUFFLGFBQWE7d0JBQ3hDLFNBQVMsRUFBRSxnQkFBZ0I7d0JBQzNCLFdBQVcsRUFBRSx3QkFBd0I7d0JBQ3JDLFlBQVksRUFBRSx5QkFBeUI7d0JBQ3ZDLFdBQVcsRUFBRSxrQkFBa0I7cUJBQ2hDO29CQUNELFNBQVMsRUFBRTt3QkFDVDs0QkFDRSxPQUFPLEVBQUUsaUJBQWlCOzRCQUMxQixXQUFXLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUM7NEJBQ3pDLEtBQUssRUFBRSxJQUFJO3lCQUNaO3FCQUNGO2lCQUNGO3dEQUlLLEVBQUU7c0JBREwsS0FBSztnQkFZRixlQUFlO3NCQURsQixLQUFLO3VCQUFDLFVBQVU7Z0JBV2IsS0FBSztzQkFEUixLQUFLO3VCQUFDLGlCQUFpQjtnQkFhcEIsUUFBUTtzQkFEWCxLQUFLO3VCQUFDLEVBQUMsS0FBSyxFQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBQztnQkFjN0QsUUFBUTtzQkFEWCxLQUFLO3VCQUFDLEVBQUMsS0FBSyxFQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBQztnQkFXN0QsbUJBQW1CO3NCQUR0QixLQUFLO3VCQUFDLEVBQUMsS0FBSyxFQUFFLCtCQUErQixFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBQztnQkFXeEUsV0FBVztzQkFEZCxLQUFLO3VCQUFDLHVCQUF1QjtnQkFnQjFCLFdBQVc7c0JBRGQsS0FBSzt1QkFBQyx1QkFBdUI7Z0JBYTFCLHNCQUFzQjtzQkFEekIsS0FBSzt1QkFBQyxFQUFDLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUM7Z0JBWTNFLHVCQUF1QjtzQkFEMUIsS0FBSzt1QkFBQyxFQUFDLEtBQUssRUFBRSxvQ0FBb0MsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUM7Z0JBYXZDLFdBQVc7c0JBQXBELE1BQU07dUJBQUMsdUJBQXVCO2dCQUc0QixPQUFPO3NCQUFqRSxlQUFlO3VCQUFDLFNBQVMsRUFBRSxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBY3RpdmVEZXNjZW5kYW50S2V5TWFuYWdlciwgSGlnaGxpZ2h0YWJsZSwgTGlzdEtleU1hbmFnZXJPcHRpb259IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7RGlyZWN0aW9uYWxpdHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9iaWRpJztcbmltcG9ydCB7Y29lcmNlQXJyYXl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1NlbGVjdGlvbk1vZGVsfSBmcm9tICdAYW5ndWxhci9jZGsvY29sbGVjdGlvbnMnO1xuaW1wb3J0IHtcbiAgQSxcbiAgRE9XTl9BUlJPVyxcbiAgRU5ELFxuICBFTlRFUixcbiAgaGFzTW9kaWZpZXJLZXksXG4gIEhPTUUsXG4gIExFRlRfQVJST1csXG4gIFJJR0hUX0FSUk9XLFxuICBTUEFDRSxcbiAgVVBfQVJST1csXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge1BsYXRmb3JtfSBmcm9tICdAYW5ndWxhci9jZGsvcGxhdGZvcm0nO1xuaW1wb3J0IHtcbiAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgYm9vbGVhbkF0dHJpYnV0ZSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbnRlbnRDaGlsZHJlbixcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBmb3J3YXJkUmVmLFxuICBpbmplY3QsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uSW5pdCxcbiAgT25EZXN0cm95LFxuICBPdXRwdXQsXG4gIFF1ZXJ5TGlzdCxcbiAgc2lnbmFsLFxuICBSZW5kZXJlcjIsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtDb250cm9sVmFsdWVBY2Nlc3NvciwgTkdfVkFMVUVfQUNDRVNTT1J9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcbmltcG9ydCB7ZGVmZXIsIGZyb21FdmVudCwgbWVyZ2UsIE9ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaWx0ZXIsIG1hcCwgc3RhcnRXaXRoLCBzd2l0Y2hNYXAsIHRha2VVbnRpbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG4vKiogVGhlIG5leHQgaWQgdG8gdXNlIGZvciBjcmVhdGluZyB1bmlxdWUgRE9NIElEcy4gKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIFNlbGVjdGlvbk1vZGVsIHRoYXQgaW50ZXJuYWxseSBhbHdheXMgcmVwcmVzZW50cyB0aGUgc2VsZWN0aW9uIGFzIGFcbiAqIG11bHRpLXNlbGVjdGlvbi4gVGhpcyBpcyBuZWNlc3Nhcnkgc28gdGhhdCB3ZSBjYW4gcmVjb3ZlciB0aGUgZnVsbCBzZWxlY3Rpb24gaWYgdGhlIHVzZXJcbiAqIHN3aXRjaGVzIHRoZSBsaXN0Ym94IGZyb20gc2luZ2xlLXNlbGVjdGlvbiB0byBtdWx0aS1zZWxlY3Rpb24gYWZ0ZXIgaW5pdGlhbGl6YXRpb24uXG4gKlxuICogVGhpcyBzZWxlY3Rpb24gbW9kZWwgbWF5IHJlcG9ydCBtdWx0aXBsZSBzZWxlY3RlZCB2YWx1ZXMsIGV2ZW4gaWYgaXQgaXMgaW4gc2luZ2xlLXNlbGVjdGlvblxuICogbW9kZS4gSXQgaXMgdXAgdG8gdGhlIHVzZXIgKENka0xpc3Rib3gpIHRvIGNoZWNrIGZvciBpbnZhbGlkIHNlbGVjdGlvbnMuXG4gKi9cbmNsYXNzIExpc3Rib3hTZWxlY3Rpb25Nb2RlbDxUPiBleHRlbmRzIFNlbGVjdGlvbk1vZGVsPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIG11bHRpcGxlID0gZmFsc2UsXG4gICAgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXM/OiBUW10sXG4gICAgZW1pdENoYW5nZXMgPSB0cnVlLFxuICAgIGNvbXBhcmVXaXRoPzogKG8xOiBULCBvMjogVCkgPT4gYm9vbGVhbixcbiAgKSB7XG4gICAgc3VwZXIodHJ1ZSwgaW5pdGlhbGx5U2VsZWN0ZWRWYWx1ZXMsIGVtaXRDaGFuZ2VzLCBjb21wYXJlV2l0aCk7XG4gIH1cblxuICBvdmVycmlkZSBpc011bHRpcGxlU2VsZWN0aW9uKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm11bHRpcGxlO1xuICB9XG5cbiAgb3ZlcnJpZGUgc2VsZWN0KC4uLnZhbHVlczogVFtdKSB7XG4gICAgLy8gVGhlIHN1cGVyIGNsYXNzIGlzIGFsd2F5cyBpbiBtdWx0aS1zZWxlY3Rpb24gbW9kZSwgc28gd2UgbmVlZCB0byBvdmVycmlkZSB0aGUgYmVoYXZpb3IgaWZcbiAgICAvLyB0aGlzIHNlbGVjdGlvbiBtb2RlbCBhY3R1YWxseSBiZWxvbmdzIHRvIGEgc2luZ2xlLXNlbGVjdGlvbiBsaXN0Ym94LlxuICAgIGlmICh0aGlzLm11bHRpcGxlKSB7XG4gICAgICByZXR1cm4gc3VwZXIuc2VsZWN0KC4uLnZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdXBlci5zZXRTZWxlY3Rpb24oLi4udmFsdWVzKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEEgc2VsZWN0YWJsZSBvcHRpb24gaW4gYSBsaXN0Ym94LiAqL1xuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka09wdGlvbl0nLFxuICBzdGFuZGFsb25lOiB0cnVlLFxuICBleHBvcnRBczogJ2Nka09wdGlvbicsXG4gIGhvc3Q6IHtcbiAgICAncm9sZSc6ICdvcHRpb24nLFxuICAgICdjbGFzcyc6ICdjZGstb3B0aW9uJyxcbiAgICAnW2lkXSc6ICdpZCcsXG4gICAgJ1thdHRyLmFyaWEtc2VsZWN0ZWRdJzogJ2lzU2VsZWN0ZWQoKScsXG4gICAgJ1thdHRyLnRhYmluZGV4XSc6ICdfZ2V0VGFiSW5kZXgoKScsXG4gICAgJ1thdHRyLmFyaWEtZGlzYWJsZWRdJzogJ2Rpc2FibGVkJyxcbiAgICAnW2NsYXNzLmNkay1vcHRpb24tYWN0aXZlXSc6ICdpc0FjdGl2ZSgpJyxcbiAgICAnKGNsaWNrKSc6ICdfY2xpY2tlZC5uZXh0KCRldmVudCknLFxuICAgICcoZm9jdXMpJzogJ19oYW5kbGVGb2N1cygpJyxcbiAgfSxcbn0pXG5leHBvcnQgY2xhc3MgQ2RrT3B0aW9uPFQgPSB1bmtub3duPlxuICBpbXBsZW1lbnRzIE9uSW5pdCwgTGlzdEtleU1hbmFnZXJPcHRpb24sIEhpZ2hsaWdodGFibGUsIE9uRGVzdHJveVxue1xuICAvKiogVGhlIGlkIG9mIHRoZSBvcHRpb24ncyBob3N0IGVsZW1lbnQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faWQgfHwgdGhpcy5fZ2VuZXJhdGVkSWQ7XG4gIH1cbiAgc2V0IGlkKHZhbHVlKSB7XG4gICAgdGhpcy5faWQgPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9pZDogc3RyaW5nO1xuICBwcml2YXRlIF9nZW5lcmF0ZWRJZCA9IGBjZGstb3B0aW9uLSR7bmV4dElkKyt9YDtcblxuICAvKiogVGhlIHZhbHVlIG9mIHRoaXMgb3B0aW9uLiAqL1xuICBASW5wdXQoJ2Nka09wdGlvbicpIHZhbHVlOiBUO1xuXG4gIC8qKlxuICAgKiBUaGUgdGV4dCB1c2VkIHRvIGxvY2F0ZSB0aGlzIGl0ZW0gZHVyaW5nIGxpc3Rib3ggdHlwZWFoZWFkLiBJZiBub3Qgc3BlY2lmaWVkLFxuICAgKiB0aGUgYHRleHRDb250ZW50YCBvZiB0aGUgaXRlbSB3aWxsIGJlIHVzZWQuXG4gICAqL1xuICBASW5wdXQoJ2Nka09wdGlvblR5cGVhaGVhZExhYmVsJykgdHlwZWFoZWFkTGFiZWw6IHN0cmluZyB8IG51bGw7XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgZGlzYWJsZWQuICovXG4gIEBJbnB1dCh7YWxpYXM6ICdjZGtPcHRpb25EaXNhYmxlZCcsIHRyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBkaXNhYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5saXN0Ym94LmRpc2FibGVkIHx8IHRoaXMuX2Rpc2FibGVkKCk7XG4gIH1cbiAgc2V0IGRpc2FibGVkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5fZGlzYWJsZWQuc2V0KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZCA9IHNpZ25hbChmYWxzZSk7XG5cbiAgLyoqIFRoZSB0YWJpbmRleCBvZiB0aGUgb3B0aW9uIHdoZW4gaXQgaXMgZW5hYmxlZC4gKi9cbiAgQElucHV0KCd0YWJpbmRleCcpXG4gIGdldCBlbmFibGVkVGFiSW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2VuYWJsZWRUYWJJbmRleCgpID09PSB1bmRlZmluZWRcbiAgICAgID8gdGhpcy5saXN0Ym94LmVuYWJsZWRUYWJJbmRleFxuICAgICAgOiB0aGlzLl9lbmFibGVkVGFiSW5kZXgoKTtcbiAgfVxuICBzZXQgZW5hYmxlZFRhYkluZGV4KHZhbHVlKSB7XG4gICAgdGhpcy5fZW5hYmxlZFRhYkluZGV4LnNldCh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZW5hYmxlZFRhYkluZGV4ID0gc2lnbmFsPG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQ+KHVuZGVmaW5lZCk7XG5cbiAgLyoqIFRoZSBvcHRpb24ncyBob3N0IGVsZW1lbnQgKi9cbiAgcmVhZG9ubHkgZWxlbWVudDogSFRNTEVsZW1lbnQgPSBpbmplY3QoRWxlbWVudFJlZikubmF0aXZlRWxlbWVudDtcblxuICAvKiogVGhlIHBhcmVudCBsaXN0Ym94IHRoaXMgb3B0aW9uIGJlbG9uZ3MgdG8uICovXG4gIHByb3RlY3RlZCByZWFkb25seSBsaXN0Ym94OiBDZGtMaXN0Ym94PFQ+ID0gaW5qZWN0KENka0xpc3Rib3gpO1xuXG4gIC8qKiBUaGUgcmVuZGVyZXIgdXNlZCB0byBtb2RpZnkgdGhlIGxpc3Rib3ggZWxlbWVudC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHJlbmRlcmVyOiBSZW5kZXJlcjIgPSBpbmplY3QoUmVuZGVyZXIyKTtcblxuICAvKiogRW1pdHMgd2hlbiB0aGUgb3B0aW9uIGlzIGRlc3Ryb3llZC4gKi9cbiAgcHJvdGVjdGVkIGRlc3Ryb3llZCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIG9wdGlvbiBpcyBjbGlja2VkLiAqL1xuICByZWFkb25seSBfY2xpY2tlZCA9IG5ldyBTdWJqZWN0PE1vdXNlRXZlbnQ+KCk7XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5yZW5kZXJlci5zZXRQcm9wZXJ0eSh0aGlzLmVsZW1lbnQsICdpbm5lckhUTUwnLCB0aGlzLnZhbHVlKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveWVkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3llZC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgc2VsZWN0ZWQuICovXG4gIGlzU2VsZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGJveC5pc1NlbGVjdGVkKHRoaXMpO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBvcHRpb24gaXMgYWN0aXZlLiAqL1xuICBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0Ym94LmlzQWN0aXZlKHRoaXMpO1xuICB9XG5cbiAgLyoqIFRvZ2dsZSB0aGUgc2VsZWN0ZWQgc3RhdGUgb2YgdGhpcyBvcHRpb24uICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzLmxpc3Rib3gudG9nZ2xlKHRoaXMpO1xuICB9XG5cbiAgLyoqIFNlbGVjdCB0aGlzIG9wdGlvbiBpZiBpdCBpcyBub3Qgc2VsZWN0ZWQuICovXG4gIHNlbGVjdCgpIHtcbiAgICB0aGlzLmxpc3Rib3guc2VsZWN0KHRoaXMpO1xuICB9XG5cbiAgLyoqIERlc2VsZWN0IHRoaXMgb3B0aW9uIGlmIGl0IGlzIHNlbGVjdGVkLiAqL1xuICBkZXNlbGVjdCgpIHtcbiAgICB0aGlzLmxpc3Rib3guZGVzZWxlY3QodGhpcyk7XG4gIH1cblxuICAvKiogRm9jdXMgdGhpcyBvcHRpb24uICovXG4gIGZvY3VzKCkge1xuICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgbGFiZWwgZm9yIHRoaXMgZWxlbWVudCB3aGljaCBpcyByZXF1aXJlZCBieSB0aGUgRm9jdXNhYmxlT3B0aW9uIGludGVyZmFjZS4gKi9cbiAgZ2V0TGFiZWwoKSB7XG4gICAgcmV0dXJuICh0aGlzLnR5cGVhaGVhZExhYmVsID8/IHRoaXMuZWxlbWVudC50ZXh0Q29udGVudD8udHJpbSgpKSB8fCAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBOby1vcCBpbXBsZW1lbnRlZCBhcyBhIHBhcnQgb2YgYEhpZ2hsaWdodGFibGVgLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBzZXRBY3RpdmVTdHlsZXMoKSB7XG4gICAgLy8gSWYgdGhlIGxpc3Rib3ggaXMgdXNpbmcgYGFyaWEtYWN0aXZlZGVzY2VuZGFudGAgdGhlIG9wdGlvbiB3b24ndCBoYXZlIGZvY3VzIHNvIHRoZVxuICAgIC8vIGJyb3dzZXIgd29uJ3Qgc2Nyb2xsIHRoZW0gaW50byB2aWV3IGF1dG9tYXRpY2FsbHkgc28gd2UgbmVlZCB0byBkbyBpdCBvdXJzZWx2ZXMuXG4gICAgaWYgKHRoaXMubGlzdGJveC51c2VBY3RpdmVEZXNjZW5kYW50KSB7XG4gICAgICB0aGlzLmVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoe2Jsb2NrOiAnbmVhcmVzdCcsIGlubGluZTogJ25lYXJlc3QnfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE5vLW9wIGltcGxlbWVudGVkIGFzIGEgcGFydCBvZiBgSGlnaGxpZ2h0YWJsZWAuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHNldEluYWN0aXZlU3R5bGVzKCkge31cblxuICAvKiogSGFuZGxlIGZvY3VzIGV2ZW50cyBvbiB0aGUgb3B0aW9uLiAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUZvY3VzKCkge1xuICAgIC8vIE9wdGlvbnMgY2FuIHdpbmQgdXAgZ2V0dGluZyBmb2N1c2VkIGluIGFjdGl2ZSBkZXNjZW5kYW50IG1vZGUgaWYgdGhlIHVzZXIgY2xpY2tzIG9uIHRoZW0uXG4gICAgLy8gSW4gdGhpcyBjYXNlLCB3ZSBwdXNoIGZvY3VzIGJhY2sgdG8gdGhlIHBhcmVudCBsaXN0Ym94IHRvIHByZXZlbnQgYW4gZXh0cmEgdGFiIHN0b3Agd2hlblxuICAgIC8vIHRoZSB1c2VyIHBlcmZvcm1zIGEgc2hpZnQrdGFiLlxuICAgIGlmICh0aGlzLmxpc3Rib3gudXNlQWN0aXZlRGVzY2VuZGFudCkge1xuICAgICAgdGhpcy5saXN0Ym94Ll9zZXRBY3RpdmVPcHRpb24odGhpcyk7XG4gICAgICB0aGlzLmxpc3Rib3guZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2V0IHRoZSB0YWJpbmRleCBmb3IgdGhpcyBvcHRpb24uICovXG4gIHByb3RlY3RlZCBfZ2V0VGFiSW5kZXgoKSB7XG4gICAgaWYgKHRoaXMubGlzdGJveC51c2VBY3RpdmVEZXNjZW5kYW50IHx8IHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaXNBY3RpdmUoKSA/IHRoaXMuZW5hYmxlZFRhYkluZGV4IDogLTE7XG4gIH1cbn1cblxuQERpcmVjdGl2ZSh7XG4gIHNlbGVjdG9yOiAnW2Nka0xpc3Rib3hdJyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgZXhwb3J0QXM6ICdjZGtMaXN0Ym94JyxcbiAgaG9zdDoge1xuICAgICdyb2xlJzogJ2xpc3Rib3gnLFxuICAgICdjbGFzcyc6ICdjZGstbGlzdGJveCcsXG4gICAgJ1tpZF0nOiAnaWQnLFxuICAgICdbYXR0ci50YWJpbmRleF0nOiAnX2dldFRhYkluZGV4KCknLFxuICAgICdbYXR0ci5hcmlhLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1thdHRyLmFyaWEtbXVsdGlzZWxlY3RhYmxlXSc6ICdtdWx0aXBsZScsXG4gICAgJ1thdHRyLmFyaWEtYWN0aXZlZGVzY2VuZGFudF0nOiAnX2dldEFyaWFBY3RpdmVEZXNjZW5kYW50KCknLFxuICAgICdbYXR0ci5hcmlhLW9yaWVudGF0aW9uXSc6ICdvcmllbnRhdGlvbicsXG4gICAgJyhmb2N1cyknOiAnX2hhbmRsZUZvY3VzKCknLFxuICAgICcoa2V5ZG93biknOiAnX2hhbmRsZUtleWRvd24oJGV2ZW50KScsXG4gICAgJyhmb2N1c291dCknOiAnX2hhbmRsZUZvY3VzT3V0KCRldmVudCknLFxuICAgICcoZm9jdXNpbiknOiAnX2hhbmRsZUZvY3VzSW4oKScsXG4gIH0sXG4gIHByb3ZpZGVyczogW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuICAgICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gQ2RrTGlzdGJveCksXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBDZGtMaXN0Ym94PFQgPSB1bmtub3duPiBpbXBsZW1lbnRzIEFmdGVyQ29udGVudEluaXQsIE9uRGVzdHJveSwgQ29udHJvbFZhbHVlQWNjZXNzb3Ige1xuICAvKiogVGhlIGlkIG9mIHRoZSBvcHRpb24ncyBob3N0IGVsZW1lbnQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faWQgfHwgdGhpcy5fZ2VuZXJhdGVkSWQ7XG4gIH1cbiAgc2V0IGlkKHZhbHVlKSB7XG4gICAgdGhpcy5faWQgPSB2YWx1ZTtcbiAgfVxuICBwcml2YXRlIF9pZDogc3RyaW5nO1xuICBwcml2YXRlIF9nZW5lcmF0ZWRJZCA9IGBjZGstbGlzdGJveC0ke25leHRJZCsrfWA7XG5cbiAgLyoqIFRoZSB0YWJpbmRleCB0byB1c2Ugd2hlbiB0aGUgbGlzdGJveCBpcyBlbmFibGVkLiAqL1xuICBASW5wdXQoJ3RhYmluZGV4JylcbiAgZ2V0IGVuYWJsZWRUYWJJbmRleCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZW5hYmxlZFRhYkluZGV4KCkgPT09IHVuZGVmaW5lZCA/IDAgOiB0aGlzLl9lbmFibGVkVGFiSW5kZXgoKTtcbiAgfVxuICBzZXQgZW5hYmxlZFRhYkluZGV4KHZhbHVlKSB7XG4gICAgdGhpcy5fZW5hYmxlZFRhYkluZGV4LnNldCh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfZW5hYmxlZFRhYkluZGV4ID0gc2lnbmFsPG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQ+KHVuZGVmaW5lZCk7XG5cbiAgLyoqIFRoZSB2YWx1ZSBzZWxlY3RlZCBpbiB0aGUgbGlzdGJveCwgcmVwcmVzZW50ZWQgYXMgYW4gYXJyYXkgb2Ygb3B0aW9uIHZhbHVlcy4gKi9cbiAgQElucHV0KCdjZGtMaXN0Ym94VmFsdWUnKVxuICBnZXQgdmFsdWUoKTogcmVhZG9ubHkgVFtdIHtcbiAgICByZXR1cm4gdGhpcy5faW52YWxpZCA/IFtdIDogdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZWxlY3RlZDtcbiAgfVxuICBzZXQgdmFsdWUodmFsdWU6IHJlYWRvbmx5IFRbXSkge1xuICAgIHRoaXMuX3NldFNlbGVjdGlvbih2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbGlzdGJveCBhbGxvd3MgbXVsdGlwbGUgb3B0aW9ucyB0byBiZSBzZWxlY3RlZC4gSWYgdGhlIHZhbHVlIHN3aXRjaGVzIGZyb20gYHRydWVgXG4gICAqIHRvIGBmYWxzZWAsIGFuZCBtb3JlIHRoYW4gb25lIG9wdGlvbiBpcyBzZWxlY3RlZCwgYWxsIG9wdGlvbnMgYXJlIGRlc2VsZWN0ZWQuXG4gICAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrTGlzdGJveE11bHRpcGxlJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZ2V0IG11bHRpcGxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbk1vZGVsLm11bHRpcGxlO1xuICB9XG4gIHNldCBtdWx0aXBsZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwubXVsdGlwbGUgPSB2YWx1ZTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZUludGVybmFsVmFsdWUoKTtcbiAgICB9XG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgbGlzdGJveCBpcyBkaXNhYmxlZC4gKi9cbiAgQElucHV0KHthbGlhczogJ2Nka0xpc3Rib3hEaXNhYmxlZCcsIHRyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBkaXNhYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQoKTtcbiAgfVxuICBzZXQgZGlzYWJsZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9kaXNhYmxlZC5zZXQodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2Rpc2FibGVkID0gc2lnbmFsKGZhbHNlKTtcblxuICAvKiogV2hldGhlciB0aGUgbGlzdGJveCB3aWxsIHVzZSBhY3RpdmUgZGVzY2VuZGFudCBvciB3aWxsIG1vdmUgZm9jdXMgb250byB0aGUgb3B0aW9ucy4gKi9cbiAgQElucHV0KHthbGlhczogJ2Nka0xpc3Rib3hVc2VBY3RpdmVEZXNjZW5kYW50JywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZ2V0IHVzZUFjdGl2ZURlc2NlbmRhbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3VzZUFjdGl2ZURlc2NlbmRhbnQoKTtcbiAgfVxuICBzZXQgdXNlQWN0aXZlRGVzY2VuZGFudCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuX3VzZUFjdGl2ZURlc2NlbmRhbnQuc2V0KHZhbHVlKTtcbiAgfVxuICBwcml2YXRlIF91c2VBY3RpdmVEZXNjZW5kYW50ID0gc2lnbmFsKGZhbHNlKTtcblxuICAvKiogVGhlIG9yaWVudGF0aW9uIG9mIHRoZSBsaXN0Ym94LiBPbmx5IGFmZmVjdHMga2V5Ym9hcmQgaW50ZXJhY3Rpb24sIG5vdCB2aXN1YWwgbGF5b3V0LiAqL1xuICBASW5wdXQoJ2Nka0xpc3Rib3hPcmllbnRhdGlvbicpXG4gIGdldCBvcmllbnRhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZW50YXRpb247XG4gIH1cbiAgc2V0IG9yaWVudGF0aW9uKHZhbHVlOiAnaG9yaXpvbnRhbCcgfCAndmVydGljYWwnKSB7XG4gICAgdGhpcy5fb3JpZW50YXRpb24gPSB2YWx1ZSA9PT0gJ2hvcml6b250YWwnID8gJ2hvcml6b250YWwnIDogJ3ZlcnRpY2FsJztcbiAgICBpZiAodmFsdWUgPT09ICdob3Jpem9udGFsJykge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlcj8ud2l0aEhvcml6b250YWxPcmllbnRhdGlvbih0aGlzLl9kaXI/LnZhbHVlIHx8ICdsdHInKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlcj8ud2l0aFZlcnRpY2FsT3JpZW50YXRpb24oKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfb3JpZW50YXRpb246ICdob3Jpem9udGFsJyB8ICd2ZXJ0aWNhbCcgPSAndmVydGljYWwnO1xuXG4gIC8qKiBUaGUgZnVuY3Rpb24gdXNlZCB0byBjb21wYXJlIG9wdGlvbiB2YWx1ZXMuICovXG4gIEBJbnB1dCgnY2RrTGlzdGJveENvbXBhcmVXaXRoJylcbiAgZ2V0IGNvbXBhcmVXaXRoKCk6IHVuZGVmaW5lZCB8ICgobzE6IFQsIG8yOiBUKSA9PiBib29sZWFuKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9uTW9kZWwuY29tcGFyZVdpdGg7XG4gIH1cbiAgc2V0IGNvbXBhcmVXaXRoKGZuOiB1bmRlZmluZWQgfCAoKG8xOiBULCBvMjogVCkgPT4gYm9vbGVhbikpIHtcbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNvbXBhcmVXaXRoID0gZm47XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUga2V5Ym9hcmQgbmF2aWdhdGlvbiBzaG91bGQgd3JhcCB3aGVuIHRoZSB1c2VyIHByZXNzZXMgYXJyb3cgZG93biBvbiB0aGUgbGFzdCBpdGVtXG4gICAqIG9yIGFycm93IHVwIG9uIHRoZSBmaXJzdCBpdGVtLlxuICAgKi9cbiAgQElucHV0KHthbGlhczogJ2Nka0xpc3Rib3hOYXZpZ2F0aW9uV3JhcERpc2FibGVkJywgdHJhbnNmb3JtOiBib29sZWFuQXR0cmlidXRlfSlcbiAgZ2V0IG5hdmlnYXRpb25XcmFwRGlzYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25hdmlnYXRpb25XcmFwRGlzYWJsZWQ7XG4gIH1cbiAgc2V0IG5hdmlnYXRpb25XcmFwRGlzYWJsZWQod3JhcDogYm9vbGVhbikge1xuICAgIHRoaXMuX25hdmlnYXRpb25XcmFwRGlzYWJsZWQgPSB3cmFwO1xuICAgIHRoaXMubGlzdEtleU1hbmFnZXI/LndpdGhXcmFwKCF0aGlzLl9uYXZpZ2F0aW9uV3JhcERpc2FibGVkKTtcbiAgfVxuICBwcml2YXRlIF9uYXZpZ2F0aW9uV3JhcERpc2FibGVkID0gZmFsc2U7XG5cbiAgLyoqIFdoZXRoZXIga2V5Ym9hcmQgbmF2aWdhdGlvbiBzaG91bGQgc2tpcCBvdmVyIGRpc2FibGVkIGl0ZW1zLiAqL1xuICBASW5wdXQoe2FsaWFzOiAnY2RrTGlzdGJveE5hdmlnYXRlc0Rpc2FibGVkT3B0aW9ucycsIHRyYW5zZm9ybTogYm9vbGVhbkF0dHJpYnV0ZX0pXG4gIGdldCBuYXZpZ2F0ZURpc2FibGVkT3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5fbmF2aWdhdGVEaXNhYmxlZE9wdGlvbnM7XG4gIH1cbiAgc2V0IG5hdmlnYXRlRGlzYWJsZWRPcHRpb25zKHNraXA6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9uYXZpZ2F0ZURpc2FibGVkT3B0aW9ucyA9IHNraXA7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlcj8uc2tpcFByZWRpY2F0ZShcbiAgICAgIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID8gdGhpcy5fc2tpcE5vbmVQcmVkaWNhdGUgOiB0aGlzLl9za2lwRGlzYWJsZWRQcmVkaWNhdGUsXG4gICAgKTtcbiAgfVxuICBwcml2YXRlIF9uYXZpZ2F0ZURpc2FibGVkT3B0aW9ucyA9IGZhbHNlO1xuXG4gIC8qKiBFbWl0cyB3aGVuIHRoZSBzZWxlY3RlZCB2YWx1ZShzKSBpbiB0aGUgbGlzdGJveCBjaGFuZ2UuICovXG4gIEBPdXRwdXQoJ2Nka0xpc3Rib3hWYWx1ZUNoYW5nZScpIHJlYWRvbmx5IHZhbHVlQ2hhbmdlID0gbmV3IFN1YmplY3Q8TGlzdGJveFZhbHVlQ2hhbmdlRXZlbnQ8VD4+KCk7XG5cbiAgLyoqIFRoZSBjaGlsZCBvcHRpb25zIGluIHRoaXMgbGlzdGJveC4gKi9cbiAgQENvbnRlbnRDaGlsZHJlbihDZGtPcHRpb24sIHtkZXNjZW5kYW50czogdHJ1ZX0pIHByb3RlY3RlZCBvcHRpb25zOiBRdWVyeUxpc3Q8Q2RrT3B0aW9uPFQ+PjtcblxuICAvKiogVGhlIHNlbGVjdGlvbiBtb2RlbCB1c2VkIGJ5IHRoZSBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgc2VsZWN0aW9uTW9kZWwgPSBuZXcgTGlzdGJveFNlbGVjdGlvbk1vZGVsPFQ+KCk7XG5cbiAgLyoqIFRoZSBrZXkgbWFuYWdlciB0aGF0IG1hbmFnZXMga2V5Ym9hcmQgbmF2aWdhdGlvbiBmb3IgdGhpcyBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgbGlzdEtleU1hbmFnZXI6IEFjdGl2ZURlc2NlbmRhbnRLZXlNYW5hZ2VyPENka09wdGlvbjxUPj47XG5cbiAgLyoqIEVtaXRzIHdoZW4gdGhlIGxpc3Rib3ggaXMgZGVzdHJveWVkLiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZGVzdHJveWVkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvKiogVGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gaW5qZWN0KEVsZW1lbnRSZWYpLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgLyoqIFRoZSBBbmd1bGFyIHpvbmUuICovXG4gIHByb3RlY3RlZCByZWFkb25seSBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICAvKiogVGhlIGNoYW5nZSBkZXRlY3RvciBmb3IgdGhpcyBsaXN0Ym94LiAqL1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgY2hhbmdlRGV0ZWN0b3JSZWYgPSBpbmplY3QoQ2hhbmdlRGV0ZWN0b3JSZWYpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgdmFsdWUgaW4gdGhlIHNlbGVjdGlvbiBtb2RlbCBpcyBpbnZhbGlkLiAqL1xuICBwcml2YXRlIF9pbnZhbGlkID0gZmFsc2U7XG5cbiAgLyoqIFRoZSBsYXN0IHVzZXItdHJpZ2dlcmVkIG9wdGlvbi4gKi9cbiAgcHJpdmF0ZSBfbGFzdFRyaWdnZXJlZDogQ2RrT3B0aW9uPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIENhbGxiYWNrIGNhbGxlZCB3aGVuIHRoZSBsaXN0Ym94IGhhcyBiZWVuIHRvdWNoZWQgKi9cbiAgcHJpdmF0ZSBfb25Ub3VjaGVkID0gKCkgPT4ge307XG5cbiAgLyoqIENhbGxiYWNrIGNhbGxlZCB3aGVuIHRoZSBsaXN0Ym94IHZhbHVlIGNoYW5nZXMgKi9cbiAgcHJpdmF0ZSBfb25DaGFuZ2U6ICh2YWx1ZTogcmVhZG9ubHkgVFtdKSA9PiB2b2lkID0gKCkgPT4ge307XG5cbiAgLyoqIEVtaXRzIHdoZW4gYW4gb3B0aW9uIGhhcyBiZWVuIGNsaWNrZWQuICovXG4gIHByaXZhdGUgX29wdGlvbkNsaWNrZWQgPSBkZWZlcigoKSA9PlxuICAgICh0aGlzLm9wdGlvbnMuY2hhbmdlcyBhcyBPYnNlcnZhYmxlPENka09wdGlvbjxUPltdPikucGlwZShcbiAgICAgIHN0YXJ0V2l0aCh0aGlzLm9wdGlvbnMpLFxuICAgICAgc3dpdGNoTWFwKG9wdGlvbnMgPT5cbiAgICAgICAgbWVyZ2UoLi4ub3B0aW9ucy5tYXAob3B0aW9uID0+IG9wdGlvbi5fY2xpY2tlZC5waXBlKG1hcChldmVudCA9PiAoe29wdGlvbiwgZXZlbnR9KSkpKSksXG4gICAgICApLFxuICAgICksXG4gICk7XG5cbiAgLyoqIFRoZSBkaXJlY3Rpb25hbGl0eSBvZiB0aGUgcGFnZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfZGlyID0gaW5qZWN0KERpcmVjdGlvbmFsaXR5LCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICAvKiogV2hldGhlciB0aGUgY29tcG9uZW50IGlzIGJlaW5nIHJlbmRlcmVkIGluIHRoZSBicm93c2VyLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9pc0Jyb3dzZXI6IGJvb2xlYW4gPSBpbmplY3QoUGxhdGZvcm0pLmlzQnJvd3NlcjtcblxuICAvKiogQSBwcmVkaWNhdGUgdGhhdCBza2lwcyBkaXNhYmxlZCBvcHRpb25zLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9za2lwRGlzYWJsZWRQcmVkaWNhdGUgPSAob3B0aW9uOiBDZGtPcHRpb248VD4pID0+IG9wdGlvbi5kaXNhYmxlZDtcblxuICAvKiogQSBwcmVkaWNhdGUgdGhhdCBkb2VzIG5vdCBza2lwIGFueSBvcHRpb25zLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9za2lwTm9uZVByZWRpY2F0ZSA9ICgpID0+IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBsaXN0Ym94IGN1cnJlbnRseSBoYXMgZm9jdXMuICovXG4gIHByaXZhdGUgX2hhc0ZvY3VzID0gZmFsc2U7XG5cbiAgLyoqIEEgcmVmZXJlbmNlIHRvIHRoZSBvcHRpb24gdGhhdCB3YXMgYWN0aXZlIGJlZm9yZSB0aGUgbGlzdGJveCBsb3N0IGZvY3VzLiAqL1xuICBwcml2YXRlIF9wcmV2aW91c0FjdGl2ZU9wdGlvbjogQ2RrT3B0aW9uPFQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKHRoaXMuX2lzQnJvd3Nlcikge1xuICAgICAgdGhpcy5fc2V0UHJldmlvdXNBY3RpdmVPcHRpb25Bc0FjdGl2ZU9wdGlvbk9uV2luZG93Qmx1cigpO1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICB0aGlzLl92ZXJpZnlOb09wdGlvblZhbHVlQ29sbGlzaW9ucygpO1xuICAgICAgdGhpcy5fdmVyaWZ5T3B0aW9uVmFsdWVzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5faW5pdEtleU1hbmFnZXIoKTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgaW50ZXJuYWwgdmFsdWUgd2hlbmV2ZXIgdGhlIG9wdGlvbnMgb3IgdGhlIG1vZGVsIHZhbHVlIGNoYW5nZXMuXG4gICAgbWVyZ2UodGhpcy5zZWxlY3Rpb25Nb2RlbC5jaGFuZ2VkLCB0aGlzLm9wdGlvbnMuY2hhbmdlcylcbiAgICAgIC5waXBlKHN0YXJ0V2l0aChudWxsKSwgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSlcbiAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5fdXBkYXRlSW50ZXJuYWxWYWx1ZSgpKTtcblxuICAgIHRoaXMuX29wdGlvbkNsaWNrZWRcbiAgICAgIC5waXBlKFxuICAgICAgICBmaWx0ZXIoKHtvcHRpb259KSA9PiAhb3B0aW9uLmRpc2FibGVkKSxcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSxcbiAgICAgIClcbiAgICAgIC5zdWJzY3JpYmUoKHtvcHRpb24sIGV2ZW50fSkgPT4gdGhpcy5faGFuZGxlT3B0aW9uQ2xpY2tlZChvcHRpb24sIGV2ZW50KSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5kZXN0cm95ZWQubmV4dCgpO1xuICAgIHRoaXMuZGVzdHJveWVkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGUob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLnRvZ2dsZVZhbHVlKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiB0aGUgZ2l2ZW4gdmFsdWUuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGVWYWx1ZSh2YWx1ZTogVCkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC50b2dnbGUodmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbGVjdCB0aGUgZ2l2ZW4gb3B0aW9uLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gc2VsZWN0XG4gICAqL1xuICBzZWxlY3Qob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLnNlbGVjdFZhbHVlKG9wdGlvbi52YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0IHRoZSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzZWxlY3RcbiAgICovXG4gIHNlbGVjdFZhbHVlKHZhbHVlOiBUKSB7XG4gICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoZmFsc2UpO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzZWxlY3QgdGhlIGdpdmVuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIGRlc2VsZWN0XG4gICAqL1xuICBkZXNlbGVjdChvcHRpb246IENka09wdGlvbjxUPikge1xuICAgIHRoaXMuZGVzZWxlY3RWYWx1ZShvcHRpb24udmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc2VsZWN0IHRoZSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBkZXNlbGVjdFxuICAgKi9cbiAgZGVzZWxlY3RWYWx1ZSh2YWx1ZTogVCkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5kZXNlbGVjdCh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBzZWxlY3RlZCBzdGF0ZSBvZiBhbGwgb3B0aW9ucy5cbiAgICogQHBhcmFtIGlzU2VsZWN0ZWQgVGhlIG5ldyBzZWxlY3RlZCBzdGF0ZSB0byBzZXRcbiAgICovXG4gIHNldEFsbFNlbGVjdGVkKGlzU2VsZWN0ZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoIWlzU2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0aW9uTW9kZWwuY2xlYXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuX2ludmFsaWQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5jbGVhcihmYWxzZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdCguLi50aGlzLm9wdGlvbnMubWFwKG9wdGlvbiA9PiBvcHRpb24udmFsdWUpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHdoZXRoZXIgdGhlIGdpdmVuIG9wdGlvbiBpcyBzZWxlY3RlZC5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIGdldCB0aGUgc2VsZWN0ZWQgc3RhdGUgb2ZcbiAgICovXG4gIGlzU2VsZWN0ZWQob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbHVlU2VsZWN0ZWQob3B0aW9uLnZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgd2hldGhlciB0aGUgZ2l2ZW4gb3B0aW9uIGlzIGFjdGl2ZS5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRvIGdldCB0aGUgYWN0aXZlIHN0YXRlIG9mXG4gICAqL1xuICBpc0FjdGl2ZShvcHRpb246IENka09wdGlvbjxUPik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhISh0aGlzLmxpc3RLZXlNYW5hZ2VyPy5hY3RpdmVJdGVtID09PSBvcHRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB3aGV0aGVyIHRoZSBnaXZlbiB2YWx1ZSBpcyBzZWxlY3RlZC5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBnZXQgdGhlIHNlbGVjdGVkIHN0YXRlIG9mXG4gICAqL1xuICBpc1ZhbHVlU2VsZWN0ZWQodmFsdWU6IFQpIHtcbiAgICBpZiAodGhpcy5faW52YWxpZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zZWxlY3Rpb25Nb2RlbC5pc1NlbGVjdGVkKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIGxpc3Rib3gncyB2YWx1ZSBjaGFuZ2VzIGZyb20gdXNlciBpbnB1dC5cbiAgICogQHBhcmFtIGZuIFRoZSBjYWxsYmFjayB0byByZWdpc3RlclxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICByZWdpc3Rlck9uQ2hhbmdlKGZuOiAodmFsdWU6IHJlYWRvbmx5IFRbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX29uQ2hhbmdlID0gZm47XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSBsaXN0Ym94IGlzIGJsdXJyZWQgYnkgdGhlIHVzZXIuXG4gICAqIEBwYXJhbSBmbiBUaGUgY2FsbGJhY2sgdG8gcmVnaXN0ZXJcbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgcmVnaXN0ZXJPblRvdWNoZWQoZm46ICgpID0+IHt9KTogdm9pZCB7XG4gICAgdGhpcy5fb25Ub3VjaGVkID0gZm47XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbGlzdGJveCdzIHZhbHVlLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgbGlzdGJveFxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICB3cml0ZVZhbHVlKHZhbHVlOiByZWFkb25seSBUW10pOiB2b2lkIHtcbiAgICB0aGlzLl9zZXRTZWxlY3Rpb24odmFsdWUpO1xuICAgIHRoaXMuX3ZlcmlmeU9wdGlvblZhbHVlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGRpc2FibGVkIHN0YXRlIG9mIHRoZSBsaXN0Ym94LlxuICAgKiBAcGFyYW0gaXNEaXNhYmxlZCBUaGUgbmV3IGRpc2FibGVkIHN0YXRlXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKiogRm9jdXMgdGhlIGxpc3Rib3gncyBob3N0IGVsZW1lbnQuICovXG4gIGZvY3VzKCkge1xuICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIHRoZSBnaXZlbiBvcHRpb24gaW4gcmVzcG9uc2UgdG8gdXNlciBpbnRlcmFjdGlvbi5cbiAgICogLSBJbiBzaW5nbGUgc2VsZWN0aW9uIG1vZGU6IHNlbGVjdHMgdGhlIG9wdGlvbiBhbmQgZGVzZWxlY3RzIGFueSBvdGhlciBzZWxlY3RlZCBvcHRpb24uXG4gICAqIC0gSW4gbXVsdGkgc2VsZWN0aW9uIG1vZGU6IHRvZ2dsZXMgdGhlIHNlbGVjdGVkIHN0YXRlIG9mIHRoZSBvcHRpb24uXG4gICAqIEBwYXJhbSBvcHRpb24gVGhlIG9wdGlvbiB0byB0cmlnZ2VyXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJpZ2dlck9wdGlvbihvcHRpb246IENka09wdGlvbjxUPiB8IG51bGwpIHtcbiAgICBpZiAob3B0aW9uICYmICFvcHRpb24uZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuX2xhc3RUcmlnZ2VyZWQgPSBvcHRpb247XG4gICAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy5tdWx0aXBsZVxuICAgICAgICA/IHRoaXMuc2VsZWN0aW9uTW9kZWwudG9nZ2xlKG9wdGlvbi52YWx1ZSlcbiAgICAgICAgOiB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdChvcHRpb24udmFsdWUpO1xuICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5fb25DaGFuZ2UodGhpcy52YWx1ZSk7XG4gICAgICAgIHRoaXMudmFsdWVDaGFuZ2UubmV4dCh7XG4gICAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgICAgbGlzdGJveDogdGhpcyxcbiAgICAgICAgICBvcHRpb246IG9wdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgdGhlIGdpdmVuIHJhbmdlIG9mIG9wdGlvbnMgaW4gcmVzcG9uc2UgdG8gdXNlciBpbnRlcmFjdGlvbi5cbiAgICogU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIG11bHRpLXNlbGVjdGlvbiBtb2RlLlxuICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgb3B0aW9uIHRoYXQgd2FzIHRyaWdnZXJlZFxuICAgKiBAcGFyYW0gZnJvbSBUaGUgc3RhcnQgaW5kZXggb2YgdGhlIG9wdGlvbnMgdG8gdG9nZ2xlXG4gICAqIEBwYXJhbSB0byBUaGUgZW5kIGluZGV4IG9mIHRoZSBvcHRpb25zIHRvIHRvZ2dsZVxuICAgKiBAcGFyYW0gb24gV2hldGhlciB0byB0b2dnbGUgdGhlIG9wdGlvbiByYW5nZSBvblxuICAgKi9cbiAgcHJvdGVjdGVkIHRyaWdnZXJSYW5nZSh0cmlnZ2VyOiBDZGtPcHRpb248VD4gfCBudWxsLCBmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIsIG9uOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQgfHwgKHRyaWdnZXIgJiYgdHJpZ2dlci5kaXNhYmxlZCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fbGFzdFRyaWdnZXJlZCA9IHRyaWdnZXI7XG4gICAgY29uc3QgaXNFcXVhbCA9IHRoaXMuY29tcGFyZVdpdGggPz8gT2JqZWN0LmlzO1xuICAgIGNvbnN0IHVwZGF0ZVZhbHVlcyA9IFsuLi50aGlzLm9wdGlvbnNdXG4gICAgICAuc2xpY2UoTWF0aC5tYXgoMCwgTWF0aC5taW4oZnJvbSwgdG8pKSwgTWF0aC5taW4odGhpcy5vcHRpb25zLmxlbmd0aCwgTWF0aC5tYXgoZnJvbSwgdG8pICsgMSkpXG4gICAgICAuZmlsdGVyKG9wdGlvbiA9PiAhb3B0aW9uLmRpc2FibGVkKVxuICAgICAgLm1hcChvcHRpb24gPT4gb3B0aW9uLnZhbHVlKTtcbiAgICBjb25zdCBzZWxlY3RlZCA9IFsuLi50aGlzLnZhbHVlXTtcbiAgICBmb3IgKGNvbnN0IHVwZGF0ZVZhbHVlIG9mIHVwZGF0ZVZhbHVlcykge1xuICAgICAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IHNlbGVjdGVkLmZpbmRJbmRleChzZWxlY3RlZFZhbHVlID0+XG4gICAgICAgIGlzRXF1YWwoc2VsZWN0ZWRWYWx1ZSwgdXBkYXRlVmFsdWUpLFxuICAgICAgKTtcbiAgICAgIGlmIChvbiAmJiBzZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICBzZWxlY3RlZC5wdXNoKHVwZGF0ZVZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoIW9uICYmIHNlbGVjdGVkSW5kZXggIT09IC0xKSB7XG4gICAgICAgIHNlbGVjdGVkLnNwbGljZShzZWxlY3RlZEluZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGNoYW5nZWQgPSB0aGlzLnNlbGVjdGlvbk1vZGVsLnNldFNlbGVjdGlvbiguLi5zZWxlY3RlZCk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX29uQ2hhbmdlKHRoaXMudmFsdWUpO1xuICAgICAgdGhpcy52YWx1ZUNoYW5nZS5uZXh0KHtcbiAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgIGxpc3Rib3g6IHRoaXMsXG4gICAgICAgIG9wdGlvbjogdHJpZ2dlcixcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnaXZlbiBvcHRpb24gYXMgYWN0aXZlLlxuICAgKiBAcGFyYW0gb3B0aW9uIFRoZSBvcHRpb24gdG8gbWFrZSBhY3RpdmVcbiAgICovXG4gIF9zZXRBY3RpdmVPcHRpb24ob3B0aW9uOiBDZGtPcHRpb248VD4pIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldEFjdGl2ZUl0ZW0ob3B0aW9uKTtcbiAgfVxuXG4gIC8qKiBDYWxsZWQgd2hlbiB0aGUgbGlzdGJveCByZWNlaXZlcyBmb2N1cy4gKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVGb2N1cygpIHtcbiAgICBpZiAoIXRoaXMudXNlQWN0aXZlRGVzY2VuZGFudCkge1xuICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uTW9kZWwuc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLl9zZXROZXh0Rm9jdXNUb1NlbGVjdGVkT3B0aW9uKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLnNldE5leHRJdGVtQWN0aXZlKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2ZvY3VzQWN0aXZlT3B0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhbGxlZCB3aGVuIHRoZSB1c2VyIHByZXNzZXMga2V5ZG93biBvbiB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIF9oYW5kbGVLZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7a2V5Q29kZX0gPSBldmVudDtcbiAgICBjb25zdCBwcmV2aW91c0FjdGl2ZUluZGV4ID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXg7XG4gICAgY29uc3QgY3RybEtleXMgPSBbJ2N0cmxLZXknLCAnbWV0YUtleSddIGFzIGNvbnN0O1xuXG4gICAgaWYgKHRoaXMubXVsdGlwbGUgJiYga2V5Q29kZSA9PT0gQSAmJiBoYXNNb2RpZmllcktleShldmVudCwgLi4uY3RybEtleXMpKSB7XG4gICAgICAvLyBUb2dnbGUgYWxsIG9wdGlvbnMgb2ZmIGlmIHRoZXkncmUgYWxsIHNlbGVjdGVkLCBvdGhlcndpc2UgdG9nZ2xlIHRoZW0gYWxsIG9uLlxuICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgIG51bGwsXG4gICAgICAgIDAsXG4gICAgICAgIHRoaXMub3B0aW9ucy5sZW5ndGggLSAxLFxuICAgICAgICB0aGlzLm9wdGlvbnMubGVuZ3RoICE9PSB0aGlzLnZhbHVlLmxlbmd0aCxcbiAgICAgICk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMubXVsdGlwbGUgJiZcbiAgICAgIChrZXlDb2RlID09PSBTUEFDRSB8fCBrZXlDb2RlID09PSBFTlRFUikgJiZcbiAgICAgIGhhc01vZGlmaWVyS2V5KGV2ZW50LCAnc2hpZnRLZXknKVxuICAgICkge1xuICAgICAgaWYgKHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSAmJiB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMudHJpZ2dlclJhbmdlKFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbSxcbiAgICAgICAgICB0aGlzLl9nZXRMYXN0VHJpZ2dlcmVkSW5kZXgoKSA/PyB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCxcbiAgICAgICAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW1JbmRleCxcbiAgICAgICAgICAhdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5tdWx0aXBsZSAmJlxuICAgICAga2V5Q29kZSA9PT0gSE9NRSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsIC4uLmN0cmxLZXlzKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBjb25zdCB0cmlnZ2VyID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtO1xuICAgICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ITtcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRGaXJzdEl0ZW1BY3RpdmUoKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyUmFuZ2UoXG4gICAgICAgICAgdHJpZ2dlcixcbiAgICAgICAgICBmcm9tLFxuICAgICAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ISxcbiAgICAgICAgICAhdHJpZ2dlci5pc1NlbGVjdGVkKCksXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMubXVsdGlwbGUgJiZcbiAgICAgIGtleUNvZGUgPT09IEVORCAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsIC4uLmN0cmxLZXlzKSAmJlxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQsICdzaGlmdEtleScpXG4gICAgKSB7XG4gICAgICBjb25zdCB0cmlnZ2VyID0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtO1xuICAgICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ITtcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRMYXN0SXRlbUFjdGl2ZSgpO1xuICAgICAgICB0aGlzLnRyaWdnZXJSYW5nZShcbiAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICAgICF0cmlnZ2VyLmlzU2VsZWN0ZWQoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGtleUNvZGUgPT09IFNQQUNFIHx8IGtleUNvZGUgPT09IEVOVEVSKSB7XG4gICAgICB0aGlzLnRyaWdnZXJPcHRpb24odGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtKTtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaXNOYXZLZXkgPVxuICAgICAga2V5Q29kZSA9PT0gVVBfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IERPV05fQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IExFRlRfQVJST1cgfHxcbiAgICAgIGtleUNvZGUgPT09IFJJR0hUX0FSUk9XIHx8XG4gICAgICBrZXlDb2RlID09PSBIT01FIHx8XG4gICAgICBrZXlDb2RlID09PSBFTkQ7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5vbktleWRvd24oZXZlbnQpO1xuICAgIC8vIFdpbGwgc2VsZWN0IGFuIG9wdGlvbiBpZiBzaGlmdCB3YXMgcHJlc3NlZCB3aGlsZSBuYXZpZ2F0aW5nIHRvIHRoZSBvcHRpb25cbiAgICBpZiAoaXNOYXZLZXkgJiYgZXZlbnQuc2hpZnRLZXkgJiYgcHJldmlvdXNBY3RpdmVJbmRleCAhPT0gdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXgpIHtcbiAgICAgIHRoaXMudHJpZ2dlck9wdGlvbih0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBDYWxsZWQgd2hlbiBhIGZvY3VzIG1vdmVzIGludG8gdGhlIGxpc3Rib3guICovXG4gIHByb3RlY3RlZCBfaGFuZGxlRm9jdXNJbigpIHtcbiAgICAvLyBOb3RlIHRoYXQgd2UgdXNlIGEgYGZvY3VzaW5gIGhhbmRsZXIgZm9yIHRoaXMgaW5zdGVhZCBvZiB0aGUgZXhpc3RpbmcgYGZvY3VzYCBoYW5kbGVyLFxuICAgIC8vIGJlY2F1c2UgZm9jdXMgd29uJ3QgbGFuZCBvbiB0aGUgbGlzdGJveCBpZiBgdXNlQWN0aXZlRGVzY2VuZGFudGAgaXMgZW5hYmxlZC5cbiAgICB0aGlzLl9oYXNGb2N1cyA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gdGhlIGZvY3VzIGxlYXZlcyBhbiBlbGVtZW50IGluIHRoZSBsaXN0Ym94LlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIGZvY3Vzb3V0IGV2ZW50XG4gICAqL1xuICBwcm90ZWN0ZWQgX2hhbmRsZUZvY3VzT3V0KGV2ZW50OiBGb2N1c0V2ZW50KSB7XG4gICAgLy8gU29tZSBicm93c2VycyAoZS5nLiBDaHJvbWUgYW5kIEZpcmVmb3gpIHRyaWdnZXIgdGhlIGZvY3Vzb3V0IGV2ZW50IHdoZW4gdGhlIHVzZXIgcmV0dXJucyBiYWNrIHRvIHRoZSBkb2N1bWVudC5cbiAgICAvLyBUbyBwcmV2ZW50IGxvc2luZyB0aGUgYWN0aXZlIG9wdGlvbiBpbiB0aGlzIGNhc2UsIHdlIHN0b3JlIGl0IGluIGBfcHJldmlvdXNBY3RpdmVPcHRpb25gIGFuZCByZXN0b3JlIGl0IG9uIHRoZSB3aW5kb3cgYGJsdXJgIGV2ZW50XG4gICAgLy8gVGhpcyBlbnN1cmVzIHRoYXQgdGhlIGBhY3RpdmVJdGVtYCBtYXRjaGVzIHRoZSBhY3R1YWwgZm9jdXNlZCBlbGVtZW50IHdoZW4gdGhlIHVzZXIgcmV0dXJucyB0byB0aGUgZG9jdW1lbnQuXG4gICAgdGhpcy5fcHJldmlvdXNBY3RpdmVPcHRpb24gPSB0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW07XG5cbiAgICBjb25zdCBvdGhlckVsZW1lbnQgPSBldmVudC5yZWxhdGVkVGFyZ2V0IGFzIEVsZW1lbnQ7XG4gICAgaWYgKHRoaXMuZWxlbWVudCAhPT0gb3RoZXJFbGVtZW50ICYmICF0aGlzLmVsZW1lbnQuY29udGFpbnMob3RoZXJFbGVtZW50KSkge1xuICAgICAgdGhpcy5fb25Ub3VjaGVkKCk7XG4gICAgICB0aGlzLl9oYXNGb2N1cyA9IGZhbHNlO1xuICAgICAgdGhpcy5fc2V0TmV4dEZvY3VzVG9TZWxlY3RlZE9wdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZXQgdGhlIGlkIG9mIHRoZSBhY3RpdmUgb3B0aW9uIGlmIGFjdGl2ZSBkZXNjZW5kYW50IGlzIGJlaW5nIHVzZWQuICovXG4gIHByb3RlY3RlZCBfZ2V0QXJpYUFjdGl2ZURlc2NlbmRhbnQoKTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMudXNlQWN0aXZlRGVzY2VuZGFudCA/IHRoaXMubGlzdEtleU1hbmFnZXI/LmFjdGl2ZUl0ZW0/LmlkIDogbnVsbDtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHRhYmluZGV4IGZvciB0aGUgbGlzdGJveC4gKi9cbiAgcHJvdGVjdGVkIF9nZXRUYWJJbmRleCgpIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy51c2VBY3RpdmVEZXNjZW5kYW50IHx8ICF0aGlzLmxpc3RLZXlNYW5hZ2VyLmFjdGl2ZUl0ZW0gPyB0aGlzLmVuYWJsZWRUYWJJbmRleCA6IC0xO1xuICB9XG5cbiAgLyoqIEluaXRpYWxpemUgdGhlIGtleSBtYW5hZ2VyLiAqL1xuICBwcml2YXRlIF9pbml0S2V5TWFuYWdlcigpIHtcbiAgICB0aGlzLmxpc3RLZXlNYW5hZ2VyID0gbmV3IEFjdGl2ZURlc2NlbmRhbnRLZXlNYW5hZ2VyKHRoaXMub3B0aW9ucylcbiAgICAgIC53aXRoV3JhcCghdGhpcy5fbmF2aWdhdGlvbldyYXBEaXNhYmxlZClcbiAgICAgIC53aXRoVHlwZUFoZWFkKClcbiAgICAgIC53aXRoSG9tZUFuZEVuZCgpXG4gICAgICAud2l0aEFsbG93ZWRNb2RpZmllcktleXMoWydzaGlmdEtleSddKVxuICAgICAgLnNraXBQcmVkaWNhdGUoXG4gICAgICAgIHRoaXMuX25hdmlnYXRlRGlzYWJsZWRPcHRpb25zID8gdGhpcy5fc2tpcE5vbmVQcmVkaWNhdGUgOiB0aGlzLl9za2lwRGlzYWJsZWRQcmVkaWNhdGUsXG4gICAgICApO1xuXG4gICAgaWYgKHRoaXMub3JpZW50YXRpb24gPT09ICd2ZXJ0aWNhbCcpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIud2l0aFZlcnRpY2FsT3JpZW50YXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci53aXRoSG9yaXpvbnRhbE9yaWVudGF0aW9uKHRoaXMuX2Rpcj8udmFsdWUgfHwgJ2x0cicpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdGVkLmxlbmd0aCkge1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB0aGlzLl9zZXROZXh0Rm9jdXNUb1NlbGVjdGVkT3B0aW9uKCkpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdEtleU1hbmFnZXIuY2hhbmdlLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9mb2N1c0FjdGl2ZU9wdGlvbigpKTtcblxuICAgIHRoaXMub3B0aW9ucy5jaGFuZ2VzLnBpcGUodGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IGFjdGl2ZU9wdGlvbiA9IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbTtcblxuICAgICAgLy8gSWYgdGhlIGFjdGl2ZSBvcHRpb24gd2FzIGRlbGV0ZWQsIHdlIG5lZWQgdG8gcmVzZXRcbiAgICAgIC8vIHRoZSBrZXkgbWFuYWdlciBzbyBpdCBjYW4gYWxsb3cgZm9jdXMgYmFjayBpbi5cbiAgICAgIGlmIChhY3RpdmVPcHRpb24gJiYgIXRoaXMub3B0aW9ucy5maW5kKG9wdGlvbiA9PiBvcHRpb24gPT09IGFjdGl2ZU9wdGlvbikpIHtcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRBY3RpdmVJdGVtKC0xKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBGb2N1cyB0aGUgYWN0aXZlIG9wdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZm9jdXNBY3RpdmVPcHRpb24oKSB7XG4gICAgaWYgKCF0aGlzLnVzZUFjdGl2ZURlc2NlbmRhbnQpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbT8uZm9jdXMoKTtcbiAgICB9XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHNlbGVjdGVkIHZhbHVlcy5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSBsaXN0IG9mIG5ldyBzZWxlY3RlZCB2YWx1ZXMuXG4gICAqL1xuICBwcml2YXRlIF9zZXRTZWxlY3Rpb24odmFsdWU6IHJlYWRvbmx5IFRbXSkge1xuICAgIGlmICh0aGlzLl9pbnZhbGlkKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbk1vZGVsLmNsZWFyKGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5zZXRTZWxlY3Rpb24oLi4udGhpcy5fY29lcmNlVmFsdWUodmFsdWUpKTtcblxuICAgIGlmICghdGhpcy5faGFzRm9jdXMpIHtcbiAgICAgIHRoaXMuX3NldE5leHRGb2N1c1RvU2VsZWN0ZWRPcHRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKiogU2V0cyB0aGUgZmlyc3Qgc2VsZWN0ZWQgb3B0aW9uIGFzIGZpcnN0IGluIHRoZSBrZXlib2FyZCBmb2N1cyBvcmRlci4gKi9cbiAgcHJpdmF0ZSBfc2V0TmV4dEZvY3VzVG9TZWxlY3RlZE9wdGlvbigpIHtcbiAgICAvLyBOdWxsIGNoZWNrIHRoZSBvcHRpb25zIHNpbmNlIHRoZXkgb25seSBnZXQgZGVmaW5lZCBhZnRlciBgbmdBZnRlckNvbnRlbnRJbml0YC5cbiAgICBjb25zdCBzZWxlY3RlZCA9IHRoaXMub3B0aW9ucz8uZmluZChvcHRpb24gPT4gb3B0aW9uLmlzU2VsZWN0ZWQoKSk7XG5cbiAgICBpZiAoc2VsZWN0ZWQpIHtcbiAgICAgIHRoaXMubGlzdEtleU1hbmFnZXIudXBkYXRlQWN0aXZlSXRlbShzZWxlY3RlZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgaW50ZXJuYWwgdmFsdWUgb2YgdGhlIGxpc3Rib3ggYmFzZWQgb24gdGhlIHNlbGVjdGlvbiBtb2RlbC4gKi9cbiAgcHJpdmF0ZSBfdXBkYXRlSW50ZXJuYWxWYWx1ZSgpIHtcbiAgICBjb25zdCBpbmRleENhY2hlID0gbmV3IE1hcDxULCBudW1iZXI+KCk7XG4gICAgdGhpcy5zZWxlY3Rpb25Nb2RlbC5zb3J0KChhOiBULCBiOiBUKSA9PiB7XG4gICAgICBjb25zdCBhSW5kZXggPSB0aGlzLl9nZXRJbmRleEZvclZhbHVlKGluZGV4Q2FjaGUsIGEpO1xuICAgICAgY29uc3QgYkluZGV4ID0gdGhpcy5fZ2V0SW5kZXhGb3JWYWx1ZShpbmRleENhY2hlLCBiKTtcbiAgICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gICAgfSk7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdGVkO1xuICAgIHRoaXMuX2ludmFsaWQgPVxuICAgICAgKCF0aGlzLm11bHRpcGxlICYmIHNlbGVjdGVkLmxlbmd0aCA+IDEpIHx8ICEhdGhpcy5fZ2V0SW52YWxpZE9wdGlvblZhbHVlcyhzZWxlY3RlZCkubGVuZ3RoO1xuICAgIHRoaXMuY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaW5kZXggb2YgdGhlIGdpdmVuIHZhbHVlIGluIHRoZSBnaXZlbiBsaXN0IG9mIG9wdGlvbnMuXG4gICAqIEBwYXJhbSBjYWNoZSBUaGUgY2FjaGUgb2YgaW5kaWNlcyBmb3VuZCBzbyBmYXJcbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBmaW5kXG4gICAqIEByZXR1cm4gVGhlIGluZGV4IG9mIHRoZSB2YWx1ZSBpbiB0aGUgb3B0aW9ucyBsaXN0XG4gICAqL1xuICBwcml2YXRlIF9nZXRJbmRleEZvclZhbHVlKGNhY2hlOiBNYXA8VCwgbnVtYmVyPiwgdmFsdWU6IFQpIHtcbiAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCB8fCBPYmplY3QuaXM7XG4gICAgaWYgKCFjYWNoZS5oYXModmFsdWUpKSB7XG4gICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpc0VxdWFsKHZhbHVlLCB0aGlzLm9wdGlvbnMuZ2V0KGkpIS52YWx1ZSkpIHtcbiAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhY2hlLnNldCh2YWx1ZSwgaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGUuZ2V0KHZhbHVlKSE7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIHRoZSB1c2VyIGNsaWNraW5nIGFuIG9wdGlvbi5cbiAgICogQHBhcmFtIG9wdGlvbiBUaGUgb3B0aW9uIHRoYXQgd2FzIGNsaWNrZWQuXG4gICAqL1xuICBwcml2YXRlIF9oYW5kbGVPcHRpb25DbGlja2VkKG9wdGlvbjogQ2RrT3B0aW9uPFQ+LCBldmVudDogTW91c2VFdmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5saXN0S2V5TWFuYWdlci5zZXRBY3RpdmVJdGVtKG9wdGlvbik7XG4gICAgaWYgKGV2ZW50LnNoaWZ0S2V5ICYmIHRoaXMubXVsdGlwbGUpIHtcbiAgICAgIHRoaXMudHJpZ2dlclJhbmdlKFxuICAgICAgICBvcHRpb24sXG4gICAgICAgIHRoaXMuX2dldExhc3RUcmlnZ2VyZWRJbmRleCgpID8/IHRoaXMubGlzdEtleU1hbmFnZXIuYWN0aXZlSXRlbUluZGV4ISxcbiAgICAgICAgdGhpcy5saXN0S2V5TWFuYWdlci5hY3RpdmVJdGVtSW5kZXghLFxuICAgICAgICAhb3B0aW9uLmlzU2VsZWN0ZWQoKSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHJpZ2dlck9wdGlvbihvcHRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBWZXJpZmllcyB0aGF0IG5vIHR3byBvcHRpb25zIHJlcHJlc2VudCB0aGUgc2FtZSB2YWx1ZSB1bmRlciB0aGUgY29tcGFyZVdpdGggZnVuY3Rpb24uICovXG4gIHByaXZhdGUgX3ZlcmlmeU5vT3B0aW9uVmFsdWVDb2xsaXNpb25zKCkge1xuICAgIHRoaXMub3B0aW9ucy5jaGFuZ2VzLnBpcGUoc3RhcnRXaXRoKHRoaXMub3B0aW9ucyksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3llZCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCA/PyBPYmplY3QuaXM7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBvcHRpb24gPSB0aGlzLm9wdGlvbnMuZ2V0KGkpITtcbiAgICAgICAgbGV0IGR1cGxpY2F0ZTogQ2RrT3B0aW9uPFQ+IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHRoaXMub3B0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IG90aGVyID0gdGhpcy5vcHRpb25zLmdldChqKSE7XG4gICAgICAgICAgaWYgKGlzRXF1YWwob3B0aW9uLnZhbHVlLCBvdGhlci52YWx1ZSkpIHtcbiAgICAgICAgICAgIGR1cGxpY2F0ZSA9IG90aGVyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICAvLyBUT0RPKG1tYWxlcmJhKTogTGluayB0byBkb2NzIGFib3V0IHRoaXMuXG4gICAgICAgICAgaWYgKHRoaXMuY29tcGFyZVdpdGgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgYEZvdW5kIG11bHRpcGxlIENka09wdGlvbiByZXByZXNlbnRpbmcgdGhlIHNhbWUgdmFsdWUgdW5kZXIgdGhlIGdpdmVuIGNvbXBhcmVXaXRoIGZ1bmN0aW9uYCxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9wdGlvbjE6IG9wdGlvbi5lbGVtZW50LFxuICAgICAgICAgICAgICAgIG9wdGlvbjI6IGR1cGxpY2F0ZS5lbGVtZW50LFxuICAgICAgICAgICAgICAgIGNvbXBhcmVXaXRoOiB0aGlzLmNvbXBhcmVXaXRoLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGb3VuZCBtdWx0aXBsZSBDZGtPcHRpb24gd2l0aCB0aGUgc2FtZSB2YWx1ZWAsIHtcbiAgICAgICAgICAgICAgb3B0aW9uMTogb3B0aW9uLmVsZW1lbnQsXG4gICAgICAgICAgICAgIG9wdGlvbjI6IGR1cGxpY2F0ZS5lbGVtZW50LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqIFZlcmlmaWVzIHRoYXQgdGhlIG9wdGlvbiB2YWx1ZXMgYXJlIHZhbGlkLiAqL1xuICBwcml2YXRlIF92ZXJpZnlPcHRpb25WYWx1ZXMoKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucyAmJiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgY29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnNlbGVjdGlvbk1vZGVsLnNlbGVjdGVkO1xuICAgICAgY29uc3QgaW52YWxpZFZhbHVlcyA9IHRoaXMuX2dldEludmFsaWRPcHRpb25WYWx1ZXMoc2VsZWN0ZWQpO1xuXG4gICAgICBpZiAoIXRoaXMubXVsdGlwbGUgJiYgc2VsZWN0ZWQubGVuZ3RoID4gMSkge1xuICAgICAgICB0aHJvdyBFcnJvcignTGlzdGJveCBjYW5ub3QgaGF2ZSBtb3JlIHRoYW4gb25lIHNlbGVjdGVkIHZhbHVlIGluIG11bHRpLXNlbGVjdGlvbiBtb2RlLicpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW52YWxpZFZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoJ0xpc3Rib3ggaGFzIHNlbGVjdGVkIHZhbHVlcyB0aGF0IGRvIG5vdCBtYXRjaCBhbnkgb2YgaXRzIG9wdGlvbnMuJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvZXJjZXMgYSB2YWx1ZSBpbnRvIGFuIGFycmF5IHJlcHJlc2VudGluZyBhIGxpc3Rib3ggc2VsZWN0aW9uLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvZXJjZVxuICAgKiBAcmV0dXJuIEFuIGFycmF5XG4gICAqL1xuICBwcml2YXRlIF9jb2VyY2VWYWx1ZSh2YWx1ZTogcmVhZG9ubHkgVFtdKSB7XG4gICAgcmV0dXJuIHZhbHVlID09IG51bGwgPyBbXSA6IGNvZXJjZUFycmF5KHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHN1Ymxpc3Qgb2YgdmFsdWVzIHRoYXQgZG8gbm90IHJlcHJlc2VudCB2YWxpZCBvcHRpb24gdmFsdWVzIGluIHRoaXMgbGlzdGJveC5cbiAgICogQHBhcmFtIHZhbHVlcyBUaGUgbGlzdCBvZiB2YWx1ZXNcbiAgICogQHJldHVybiBUaGUgc3VibGlzdCBvZiB2YWx1ZXMgdGhhdCBhcmUgbm90IHZhbGlkIG9wdGlvbiB2YWx1ZXNcbiAgICovXG4gIHByaXZhdGUgX2dldEludmFsaWRPcHRpb25WYWx1ZXModmFsdWVzOiByZWFkb25seSBUW10pIHtcbiAgICBjb25zdCBpc0VxdWFsID0gdGhpcy5jb21wYXJlV2l0aCB8fCBPYmplY3QuaXM7XG4gICAgY29uc3QgdmFsaWRWYWx1ZXMgPSAodGhpcy5vcHRpb25zIHx8IFtdKS5tYXAob3B0aW9uID0+IG9wdGlvbi52YWx1ZSk7XG4gICAgcmV0dXJuIHZhbHVlcy5maWx0ZXIodmFsdWUgPT4gIXZhbGlkVmFsdWVzLnNvbWUodmFsaWRWYWx1ZSA9PiBpc0VxdWFsKHZhbHVlLCB2YWxpZFZhbHVlKSkpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgdHJpZ2dlcmVkIG9wdGlvbi4gKi9cbiAgcHJpdmF0ZSBfZ2V0TGFzdFRyaWdnZXJlZEluZGV4KCkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5vcHRpb25zLnRvQXJyYXkoKS5pbmRleE9mKHRoaXMuX2xhc3RUcmlnZ2VyZWQhKTtcbiAgICByZXR1cm4gaW5kZXggPT09IC0xID8gbnVsbCA6IGluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBwcmV2aW91cyBhY3RpdmUgb3B0aW9uIGFzIGFjdGl2ZSBvcHRpb24gb24gd2luZG93IGJsdXIuXG4gICAqIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBgYWN0aXZlT3B0aW9uYCBtYXRjaGVzIHRoZSBhY3R1YWwgZm9jdXNlZCBlbGVtZW50IHdoZW4gdGhlIHVzZXIgcmV0dXJucyB0byB0aGUgZG9jdW1lbnQuXG4gICAqL1xuICBwcml2YXRlIF9zZXRQcmV2aW91c0FjdGl2ZU9wdGlvbkFzQWN0aXZlT3B0aW9uT25XaW5kb3dCbHVyKCkge1xuICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIGZyb21FdmVudCh3aW5kb3csICdibHVyJylcbiAgICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuZGVzdHJveWVkKSlcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5jb250YWlucyhkb2N1bWVudC5hY3RpdmVFbGVtZW50KSAmJiB0aGlzLl9wcmV2aW91c0FjdGl2ZU9wdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2V0QWN0aXZlT3B0aW9uKHRoaXMuX3ByZXZpb3VzQWN0aXZlT3B0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZpb3VzQWN0aXZlT3B0aW9uID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKiBDaGFuZ2UgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuZXZlciB0aGUgdmFsdWUgb2YgdGhlIGxpc3Rib3ggY2hhbmdlcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdGJveFZhbHVlQ2hhbmdlRXZlbnQ8VD4ge1xuICAvKiogVGhlIG5ldyB2YWx1ZSBvZiB0aGUgbGlzdGJveC4gKi9cbiAgcmVhZG9ubHkgdmFsdWU6IHJlYWRvbmx5IFRbXTtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBsaXN0Ym94IHRoYXQgZW1pdHRlZCB0aGUgZXZlbnQuICovXG4gIHJlYWRvbmx5IGxpc3Rib3g6IENka0xpc3Rib3g8VD47XG5cbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgb3B0aW9uIHRoYXQgd2FzIHRyaWdnZXJlZC4gKi9cbiAgcmVhZG9ubHkgb3B0aW9uOiBDZGtPcHRpb248VD4gfCBudWxsO1xufVxuIl19