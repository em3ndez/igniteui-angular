import { Component, ViewChild } from '@angular/core';
import { NgIf, DatePipe } from '@angular/common';

import { HGRID_DATA } from './hGridData';
import { GRID_DATA } from './gridData';
import { TGRID_DATA } from './tGridData';
import { IgxRowIslandComponent } from '../../../projects/igniteui-angular/src/lib/grids/hierarchical-grid/row-island.component';
import { IgxHierarchicalGridComponent } from '../../../projects/igniteui-angular/src/lib/grids/hierarchical-grid/hierarchical-grid.component';
import { IgxTreeGridComponent } from '../../../projects/igniteui-angular/src/lib/grids/tree-grid/tree-grid.component';
import { IgxIconComponent } from '../../../projects/igniteui-angular/src/lib/icon/icon.component';
import { IgxCellTemplateDirective, IgxCellHeaderTemplateDirective } from '../../../projects/igniteui-angular/src/lib/grids/columns/templates.directive';
import { IgxColumnComponent } from '../../../projects/igniteui-angular/src/lib/grids/columns/column.component';
import { IgxPaginatorComponent } from '../../../projects/igniteui-angular/src/lib/paginator/paginator.component';
import { IgxGridToolbarExporterComponent } from '../../../projects/igniteui-angular/src/lib/grids/toolbar/grid-toolbar-exporter.component';
import { IgxGridToolbarComponent } from '../../../projects/igniteui-angular/src/lib/grids/toolbar/grid-toolbar.component';
import { IgxGridComponent } from '../../../projects/igniteui-angular/src/lib/grids/grid/grid.component';
import { IgxNumberSummaryOperand, IgxSummaryResult } from '../../../projects/igniteui-angular/src/lib/grids/summaries/grid-summary';
import { ColumnType, IGridToolbarExportEventArgs } from '../../../projects/igniteui-angular/src/lib/grids/public_api';

class GridSummary {
    public operate(data?: any[]): IgxSummaryResult[] {
        const result = new IgxNumberSummaryOperand().operate(data);
        result.push({
            key: 'test',
            label: 'Custom summary',
            summaryResult: data.filter((rec) => rec > 10 && rec < 30).length
        });

        return result;
    }
}

class HGridSummary  {
    public operate(data?: any[]): IgxSummaryResult[] {
        const result = [];
        result.push(
        {
            key: 'min',
            label: 'Min',
            summaryResult: IgxNumberSummaryOperand.min(data)
        },
        {
            key: 'max',
            label: 'Max',
            summaryResult: IgxNumberSummaryOperand.max(data)
        },
        {
          key: 'avg',
          label: 'Avg',
          summaryResult: IgxNumberSummaryOperand.average(data)
        });
        return result;
    }
}

class HGridChildSummary {
    public operate(data?: any[]): IgxSummaryResult[] {
        const result = [];
        result.push(
        {
            key: 'count',
            label: 'Count',
            summaryResult: IgxNumberSummaryOperand.count(data)
        });
        return result;
    }
}

@Component({
    selector: 'app-grid-export-sample',
    templateUrl: 'grid-export.sample.html',
    standalone: true,
    imports: [IgxGridComponent, IgxGridToolbarComponent, IgxGridToolbarExporterComponent, IgxPaginatorComponent, IgxColumnComponent, IgxCellTemplateDirective, IgxCellHeaderTemplateDirective, IgxIconComponent, NgIf, IgxTreeGridComponent, IgxHierarchicalGridComponent, IgxRowIslandComponent, DatePipe]
})
export class GridExportComponent {
    @ViewChild('grid', { static: true })
    private grid: IgxGridComponent;

    @ViewChild('tGrid', { static: true })
    private tGrid: IgxTreeGridComponent;

    public gridSummary = GridSummary;
    public hGridSummary = HGridSummary;
    public hGridChildSummary = HGridChildSummary;
    public gridData;
    public tGridData;
    public hGridData;
    public productId = 0;

    constructor() {
        this.gridData = GRID_DATA;
        this.tGridData = TGRID_DATA;
        this.hGridData = HGRID_DATA;
        this.productId = GRID_DATA.length;
    }

    public toggleSummary(column: ColumnType) {
        column.hasSummary = !column.hasSummary;
    }

    public configureExport(args: IGridToolbarExportEventArgs) {
        console.log(args);
        // const options: IgxExporterOptionsBase = args.options;

        // // Change exporter options

        // options.fileName = `Report_${new Date().toDateString()}`;
        // options.exportSummaries = false;

        // // Cancel column exporting

        // args.exporter.columnExporting.subscribe((colExportingArgs: IColumnExportingEventArgs) => {
        //     if (colExportingArgs.columnIndex === 1) {
        //         colExportingArgs.cancel = true;
        //     }
        // });

        // // Cancel row exporting

        // args.exporter.rowExporting.subscribe((rowExportingArgs: IRowExportingEventArgs) => {
        //     if (rowExportingArgs.rowIndex === 1) {
        //         rowExportingArgs.cancel = true;
        //     }
        // });
    }
}
