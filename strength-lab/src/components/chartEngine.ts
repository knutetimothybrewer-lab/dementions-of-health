import {init,use} from 'echarts/core';
import {LineChart,BarChart,ScatterChart,HeatmapChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,LegendComponent,VisualMapComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
use([LineChart,BarChart,ScatterChart,HeatmapChart,GridComponent,TooltipComponent,LegendComponent,VisualMapComponent,CanvasRenderer]);
export {init};
