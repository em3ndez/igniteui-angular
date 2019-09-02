import { DebugElement } from '@angular/core';
import { async, fakeAsync, TestBed, tick, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxInputDirective } from '../../directives/input/input.directive';
import { IgxGridComponent } from './grid.component';
import { IgxGridModule } from './index';
import { IgxButtonDirective } from '../../directives/button/button.directive';
import { UIInteractions, wait } from '../../test-utils/ui-interactions.spec';
import { configureTestSuite } from '../../test-utils/configure-suite';
import {
    IgxNumberFilteringOperand,
    IgxDateFilteringOperand,
    IgxBooleanFilteringOperand,
    IgxStringFilteringOperand
} from '../../data-operations/filtering-condition';
import { IgxDatePickerComponent } from '../../date-picker/date-picker.component';
import { GridFunctions } from '../../test-utils/grid-functions.spec';
import { changei18n, getCurrentResourceStrings } from '../../core/i18n/resources';
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import { FilteringExpressionsTree } from '../../data-operations/filtering-expressions-tree';
import { FilteringLogic, IFilteringExpression } from '../../data-operations/filtering-expression.interface';
import { IgxChipComponent } from '../../chips/chip.component';
import { DisplayDensity } from '../../core/density';
import { SampleTestData } from '../../test-utils/sample-test-data.spec';
import {
    IgxGridFilteringComponent, IgxGridAdvancedFilteringComponent
} from '../../test-utils/grid-samples.spec';
import { HelperUtils, resizeObserverIgnoreError } from '../../test-utils/helper-utils.spec';

/* const strings go here */

describe('IgxGrid - Advanced Filtering', () => {
    configureTestSuite();
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxGridAdvancedFilteringComponent
            ],
            imports: [
                NoopAnimationsModule,
                IgxGridModule]
        }).compileComponents();
    }));

    afterEach(() => {
        UIInteractions.clearOverlay();
    });

    describe('', () => {
        let fix, grid: IgxGridComponent;
        beforeEach(fakeAsync(() => {
            resizeObserverIgnoreError();
            fix = TestBed.createComponent(IgxGridAdvancedFilteringComponent);
            grid = fix.componentInstance.grid;
            fix.detectChanges();
        }));

        it('Should show/hide Advanced Filtering button in toolbar based on respective input.', fakeAsync(() => {
            // Verify Advanced Filtering button in toolbar is visible.
            let advFilterButton = GridFunctions.getAdvancedFilteringButton(fix);
            expect(advFilterButton !== null && advFilterButton !== undefined).toBe(true, 'Adv.Filter button is not visible.');

            grid.allowAdvancedFiltering = false;
            fix.detectChanges();

            // Verify Advanced Filtering button in toolbar is not visible.
            advFilterButton = GridFunctions.getAdvancedFilteringButton(fix);
            expect(advFilterButton !== null && advFilterButton !== undefined).toBe(false, 'Adv.Filter button is visible.');

            grid.allowAdvancedFiltering = true;
            fix.detectChanges();

            // Verify Advanced Filtering button in toolbar is visible.
            advFilterButton = GridFunctions.getAdvancedFilteringButton(fix);
            expect(advFilterButton !== null && advFilterButton !== undefined).toBe(true, 'Adv.Filter button is not visible.');
        }));

        it('Should correctly initialize the Advanced Filtering dialog.', fakeAsync(() => {
            // Open Advanced Filtering dialog.
            GridFunctions.clickAdvancedFilteringButton(fix);
            fix.detectChanges();

            // Verify AF dialog is opened.
            expect(GridFunctions.getAdvancedFilteringComponent(fix)).not.toBeNull();

            // Verify there are not filters present and that the default text is shown.
            expect(grid.advancedFilteringExpressionsTree).toBeUndefined();
            expect(GridFunctions.getAdvancedFilteringTreeRootGroup(fix)).toBeNull();
            expect(GridFunctions.getAdvancedFilteringEmptyPrompt(fix)).not.toBeNull();

            // Close Advanced Filtering dialog.
            GridFunctions.clickAdvancedFilteringCancelButton(fix);
            tick(200);
            fix.detectChanges();

            // Verify AF dialog is closed.
            expect(GridFunctions.getAdvancedFilteringComponent(fix)).toBeNull();
        }));

        it('Should open/close Advanced Filtering dialog through API.', fakeAsync(() => {
            // Open dialog through API.
            grid.openAdvancedFilteringDialog();
            fix.detectChanges();

            // Verify AF dialog is opened.
            expect(GridFunctions.getAdvancedFilteringComponent(fix)).not.toBeNull();

            // Close dialog through API.
            grid.closeAdvancedFilteringDialog(false);
            tick(100);
            fix.detectChanges();

            // Verify AF dialog is closed.
            expect(GridFunctions.getAdvancedFilteringComponent(fix)).toBeNull();
        }));

        it('Should close Advanced Filtering dialog through API by respecting \'applyChanges\' argument.', fakeAsync(() => {
            grid.openAdvancedFilteringDialog();
            fix.detectChanges();

            // Click the initial 'Add And Group' button.
            const addAndGroupButton = GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix)[0];
            addAndGroupButton.click();
            tick(100);
            fix.detectChanges();

            // Populate edit inputs.
            selectColumnInEditModeExpression(fix, 1); // Select 'ProductName' column.
            selectOperatorInEditModeExpression(fix, 2); // Select 'Starts With' operator.
            let input = GridFunctions.getAdvancedFilteringValueInput(fix).querySelector('input');
            sendInputNativeElement(fix, input, 'ign'); // Type filter value.

            // Commit the populated expression.
            GridFunctions.clickAdvancedFilteringExpressionCommitButton(fix);
            fix.detectChanges();

            // Close dialog through API.
            grid.closeAdvancedFilteringDialog(true);
            tick(100);
            fix.detectChanges();

            // Verify AF dialog is closed.
            expect(GridFunctions.getAdvancedFilteringComponent(fix)).toBeNull();
            // Verify the filter changes are applied.
            expect(grid.filteredData.length).toEqual(2);
            expect(GridFunctions.getCurrentCellFromGrid(grid, 0, 1).value).toBe('Ignite UI for JavaScript');
            expect(GridFunctions.getCurrentCellFromGrid(grid, 1, 1).value).toBe('Ignite UI for Angular');

            // Open the dialog again.
            grid.openAdvancedFilteringDialog();
            fix.detectChanges();

            // Double-click the existing chip to enter edit mode.
            GridFunctions.clickAdvancedFilteringTreeExpressionChip(fix, [0], true);
            tick(50);
            fix.detectChanges();
            // Edit the filter value.
            input = GridFunctions.getAdvancedFilteringValueInput(fix).querySelector('input');
            sendInputNativeElement(fix, input, 'some non-existing value'); // Type filter value.
            // Commit the populated expression.
            GridFunctions.clickAdvancedFilteringExpressionCommitButton(fix);
            fix.detectChanges();

            // Close dialog through API.
            grid.closeAdvancedFilteringDialog(false);
            tick(100);
            fix.detectChanges();

            // Verify AF dialog is closed.
            expect(GridFunctions.getAdvancedFilteringComponent(fix)).toBeNull();
            // Verify the filter changes are NOT applied.
            expect(grid.filteredData.length).toEqual(2);
            expect(GridFunctions.getCurrentCellFromGrid(grid, 0, 1).value).toBe('Ignite UI for JavaScript');
            expect(GridFunctions.getCurrentCellFromGrid(grid, 1, 1).value).toBe('Ignite UI for Angular');
        }));

        it('Should show/hide initial adding buttons depending on the existence of groups.', fakeAsync(() => {
            // Open Advanced Filtering dialog.
            GridFunctions.clickAdvancedFilteringButton(fix);
            fix.detectChanges();

            // Verify that the initial buttons are visible.
            expect(GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix).length).toBe(2);

            // Click the initial 'Add And Group' button.
            const addAndGroupButton = GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix)[0];
            addAndGroupButton.click();
            tick(100);
            fix.detectChanges();

            // Verify that the initial buttons are not visible.
            expect(GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix).length).toBe(0);

            // Discard the new group and verify that the initial buttons are visible.
            GridFunctions.clickAdvancedFilteringExpressionCloseButton(fix);
            expect(GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix).length).toBe(2);

            // Click the initial 'Add Or Group' button.
            const addOrGroupButton = GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix)[1];
            addOrGroupButton.click();
            tick(100);
            fix.detectChanges();

            // Verify that the initial buttons are not visible.
            expect(GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix).length).toBe(0);
        }));

        it('Should correctly initialize a newly added \'And\' group.', fakeAsync(() => {
            // Open Advanced Filtering dialog.
            GridFunctions.clickAdvancedFilteringButton(fix);
            fix.detectChanges();

            // Click the initial 'Add And Group' button.
            const addAndGroupButton = GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix)[0];
            addAndGroupButton.click();
            tick(100);
            fix.detectChanges();

            // Verify there is a new root group, which is empty.
            const group = GridFunctions.getAdvancedFilteringTreeRootGroup(fix);
            expect(group).not.toBeNull('There is no root group.');
            expect(GridFunctions.getAdvancedFilteringTreeChildItems(group).length).toBe(0, 'The group has children.');

            // Verify the operator line of the root group is an 'And' line.
            const rootOperatorLine = GridFunctions.getAdvancedFilteringTreeRootGroupOperatorLine(fix);
            expect(rootOperatorLine.classList.contains('igx-filter-tree__line--and')).toBe(true, 'incorrect operator line');

            // Verify the enabled/disabled state of each input of the expression in edit mode.
            verifyEditModeExpressionInputStates(fix, true, false, false);

            // Verify commit expression button is disabled.
            const commitButton = GridFunctions.getAdvancedFilteringExpressionCommitButton(fix);
            expect(commitButton.classList.contains('igx-button--disabled')).toBe(true);
            // Verify close expression button is enabled.
            const closeButton = GridFunctions.getAdvancedFilteringExpressionCloseButton(fix);
            expect(closeButton.classList.contains('igx-button--disabled')).toBe(false);

            // Verify adding buttons are disabled.
            const buttons = GridFunctions.getAdvancedFilteringTreeRootGroupButtons(fix, 0);
            for (const button of buttons) {
                expect(button.classList.contains('igx-button--disabled')).toBe(true);
            }
        }));

        it('Should correctly initialize a newly added \'Or\' group.', fakeAsync(() => {
            // Open Advanced Filtering dialog.
            GridFunctions.clickAdvancedFilteringButton(fix);
            fix.detectChanges();

            // Click the initial 'Add Or Group' button.
            const addOrGroupButton = GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix)[1];
            addOrGroupButton.click();
            tick(100);
            fix.detectChanges();

            // Verify there is a new root group, which is empty.
            const group = GridFunctions.getAdvancedFilteringTreeRootGroup(fix);
            expect(group).not.toBeNull('There is no root group.');
            expect(GridFunctions.getAdvancedFilteringTreeChildItems(group).length).toBe(0, 'The group has children.');

            // Verify the operator line of the root group is an 'Or' line.
            const rootOperatorLine = GridFunctions.getAdvancedFilteringTreeRootGroupOperatorLine(fix);
            expect(rootOperatorLine.classList.contains('igx-filter-tree__line--or')).toBe(true, 'incorrect operator line');

            // Verify the enabled/disabled state of each input of the expression in edit mode.
            verifyEditModeExpressionInputStates(fix, true, false, false);

            // Verify commit expression button is disabled.
            const commitButton = GridFunctions.getAdvancedFilteringExpressionCommitButton(fix);
            expect(commitButton.classList.contains('igx-button--disabled')).toBe(true);
            // Verify close expression button is enabled.
            const closeButton = GridFunctions.getAdvancedFilteringExpressionCloseButton(fix);
            expect(closeButton.classList.contains('igx-button--disabled')).toBe(false);

            // Verify adding buttons are disabled.
            const buttons = GridFunctions.getAdvancedFilteringTreeRootGroupButtons(fix, 0);
            for (const button of buttons) {
                expect(button.classList.contains('igx-button--disabled')).toBe(true);
            }
        }));

        it('Should add a new group through initial adding button and filter by it.', fakeAsync(() => {
            // Open Advanced Filtering dialog.
            GridFunctions.clickAdvancedFilteringButton(fix);
            fix.detectChanges();

            // Click the initial 'Add And Group' button.
            const addAndGroupButton = GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix)[0];
            addAndGroupButton.click();
            tick(100);
            fix.detectChanges();

            // Verify commit button is disabled.
            let commitButton = GridFunctions.getAdvancedFilteringExpressionCommitButton(fix);
            expect(commitButton.classList.contains('igx-button--disabled')).toBe(true);

            // Verify the enabled/disabled state of each input of the expression in edit mode.
            verifyEditModeExpressionInputStates(fix, true, false, false);

            selectColumnInEditModeExpression(fix, 1); // Select 'ProductName' column.
            verifyEditModeExpressionInputStates(fix, true, true, false);

            selectOperatorInEditModeExpression(fix, 2); // Select 'Starts With' operator.
            verifyEditModeExpressionInputStates(fix, true, true, true);

            const input = GridFunctions.getAdvancedFilteringValueInput(fix).querySelector('input');
            sendInputNativeElement(fix, input, 'ign'); // Type filter value.

            // Verify commit button is now enabled.
            commitButton = GridFunctions.getAdvancedFilteringExpressionCommitButton(fix);
            expect(commitButton.classList.contains('igx-button--disabled')).toBe(false);

            // Commit the populated expression.
            GridFunctions.clickAdvancedFilteringExpressionCommitButton(fix);
            fix.detectChanges();

            // Verify the new expression has been added to the group.
            const group = GridFunctions.getAdvancedFilteringTreeRootGroup(fix);
            expect(GridFunctions.getAdvancedFilteringTreeChildExpressions(group).length).toBe(1, 'The group has no children.');

            // Apply the filters.
            GridFunctions.clickAdvancedFilteringApplyButton(fix);
            fix.detectChanges();

            // Verify the filter results.
            expect(grid.filteredData.length).toEqual(2);
            expect(GridFunctions.getCurrentCellFromGrid(grid, 0, 1).value).toBe('Ignite UI for JavaScript');
            expect(GridFunctions.getCurrentCellFromGrid(grid, 1, 1).value).toBe('Ignite UI for Angular');
        }));

        it('Should emit the onFilteringDone event when applying filters.', fakeAsync(() => {
            spyOn(grid.onFilteringDone, 'emit');

            // Open Advanced Filtering dialog.
            GridFunctions.clickAdvancedFilteringButton(fix);
            fix.detectChanges();

            // Click the initial 'Add And Group' button.
            const addAndGroupButton = GridFunctions.getAdvancedFilteringInitialAddGroupButtons(fix)[0];
            addAndGroupButton.click();
            tick(100);
            fix.detectChanges();

            // Populate edit inputs.
            selectColumnInEditModeExpression(fix, 1); // Select 'ProductName' column.
            selectOperatorInEditModeExpression(fix, 2); // Select 'Starts With' operator.
            const input = GridFunctions.getAdvancedFilteringValueInput(fix).querySelector('input');
            sendInputNativeElement(fix, input, 'ign'); // Type filter value.

            // Commit the populated expression.
            GridFunctions.clickAdvancedFilteringExpressionCommitButton(fix);
            fix.detectChanges();

            // Apply the filters.
            GridFunctions.clickAdvancedFilteringApplyButton(fix);
            fix.detectChanges();

            expect(grid.onFilteringDone.emit).toHaveBeenCalledWith(grid.advancedFilteringExpressionsTree);
        }));
    });
});

function selectColumnInEditModeExpression(fix, dropdownItemIndex: number) {
    GridFunctions.clickAdvancedFilteringColumnSelect(fix);
    fix.detectChanges();
    GridFunctions.clickAdvancedFilteringSelectDropdownItem(fix, dropdownItemIndex);
    tick();
    fix.detectChanges();
}

function selectOperatorInEditModeExpression(fix, dropdownItemIndex: number) {
    GridFunctions.clickAdvancedFilteringOperatorSelect(fix);
    fix.detectChanges();
    GridFunctions.clickAdvancedFilteringSelectDropdownItem(fix, dropdownItemIndex);
    tick();
    fix.detectChanges();
}

function sendInputNativeElement(fix, nativeElement, text) {
    nativeElement.value = text;
    nativeElement.dispatchEvent(new Event('keydown'));
    nativeElement.dispatchEvent(new Event('input'));
    nativeElement.dispatchEvent(new Event('keyup'));
    fix.detectChanges();
}

function verifyEditModeExpressionInputStates(fix,
                                             columnSelectEnabled: boolean,
                                             operatorSelectEnabled: boolean,
                                             valueInputEnabled: boolean) {
    // Verify the column select is enabled.
    const columnInputGroup = GridFunctions.getAdvancedFilteringColumnSelect(fix).querySelector('igx-input-group');
    expect(!columnInputGroup.classList.contains('igx-input-group--disabled')).toBe(columnSelectEnabled,
        'incorrect column select state');

    // Verify the operator select is disabled.
    const operatorInputGroup = GridFunctions.getAdvancedFilteringOperatorSelect(fix).querySelector('igx-input-group');
    expect(!operatorInputGroup.classList.contains('igx-input-group--disabled')).toBe(operatorSelectEnabled,
        'incorrect operator select state');

    // Verify the value input is disabled.
    const editModeContainer = GridFunctions.getAdvancedFilteringEditModeContainer(fix);
    const valueInputGroup = GridFunctions.sortNativeElementsHorizontally(
        Array.from(editModeContainer.querySelectorAll('igx-input-group')))[2];
    expect(!valueInputGroup.classList.contains('igx-input-group--disabled')).toBe(valueInputEnabled,
        'incorrect value input state');
}
