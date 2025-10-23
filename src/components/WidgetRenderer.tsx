import React, { useMemo } from 'react';
import { CrmData, DashboardWidget, DealStatus, ChartWidgetConfig, KpiWidgetConfig, TasksWidgetConfig, LeaderboardWidgetConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';

interface WidgetRendererProps {
    widget: DashboardWidget;
    data: CrmData;
}

// Type for the recharts pie label render prop to avoid using `any`
interface PieLabelRenderProps {
    // FIX: Made 'name' optional to match recharts type.
    name?: string;
    // Fix: Made 'percent' optional to resolve type incompatibility with recharts' PieLabelRenderProps.
    percent?: number;
    [key: string]: any; // Recharts passes many other props
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, data }) => {
    switch(widget.type) {
        case 'KPI':
            return <KpiWidget config={widget.config as KpiWidgetConfig} data={data} />;
        case 'FUNNEL_CHART':
            return <FunnelChartWidget config={widget.config as ChartWidgetConfig} data={data} />;
        case 'STATUS_PIE_CHART':
            return <StatusPieChartWidget config={widget.config as ChartWidgetConfig} data={data} />;
        case 'TASKS_LIST':
            return <TasksWidget config={widget.config as TasksWidgetConfig} data={data} />;
        case 'LEADERBOARD':
            return <LeaderboardWidget config={widget.config as LeaderboardWidgetConfig} data={data} />;
        default:
            return <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-red-400">Unknown widget type: {widget.type}</div>;
    }
};

// --- Individual Widget Components ---

const KpiWidget: React.FC<{ config: KpiWidgetConfig, data: CrmData }> = ({ config, data }) => {
    const { deals } = data;

    const { value, colorClass, progressBar } = useMemo(() => {
        const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        switch(config.metric) {
            case 'TOTAL_OPEN_VALUE':
                return { value: formatCurrency(deals.reduce((sum, d) => d.status === 'OPEN' ? sum + d.value : sum, 0)), colorClass: 'text-blue-400' };
            case 'TOTAL_WON_VALUE':
                return { value: formatCurrency(deals.reduce((sum, d) => d.status === 'WON' ? sum + d.value : sum, 0)), colorClass: 'text-green-400' };
            case 'TOTAL_LOST_VALUE':
                return { value: formatCurrency(deals.reduce((sum, d) => d.status === 'LOST' ? sum + d.value : sum, 0)), colorClass: 'text-red-400' };
            case 'EXPECTED_30_DAYS': {
                const today = new Date();
                const futureDate = new Date();
                futureDate.setDate(today.getDate() + 30);
                
                const dealsInPeriod = deals.filter(d => {
                    if (!d.data_vencimento) return false;
                    const vencimento = new Date(d.data_vencimento + 'T00:00:00');
                    return vencimento >= today && vencimento <= futureDate;
                });

                const totalValue = dealsInPeriod.reduce((sum, deal) => sum + deal.value, 0);
                const wonValue = dealsInPeriod.filter(d => d.status === 'WON').reduce((sum, d) => sum + d.value, 0);
                const lostValue = dealsInPeriod.filter(d => d.status === 'LOST').reduce((sum, d) => sum + d.value, 0);
                const openValue = totalValue - wonValue - lostValue;
                
                const wonPercent = totalValue > 0 ? (wonValue / totalValue) * 100 : 0;
                const lostPercent = totalValue > 0 ? (lostValue / totalValue) * 100 : 0;
                const openPercent = 100 - wonPercent - lostPercent;

                return {
                    value: formatCurrency(totalValue),
                    colorClass: 'text-yellow-400',
                    progressBar: { won: wonPercent, open: openPercent, lost: lostPercent }
                };
            }
            default:
                return { value: 'N/A', colorClass: 'text-gray-400' };
        }
    }, [config.metric, deals]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-full">
            <h3 className="text-lg font-semibold text-gray-300 truncate">{config.title}</h3>
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
             {progressBar && (
                <>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2 overflow-hidden flex">
                        <div className="bg-green-500 h-2.5" style={{ width: `${progressBar.won}%` }} title={`Won: ${progressBar.won.toFixed(1)}%`}></div>
                        <div className="bg-blue-500 h-2.5" style={{ width: `${progressBar.open}%` }} title={`Open: ${progressBar.open.toFixed(1)}%`}></div>
                        <div className="bg-red-500 h-2.5" style={{ width: `${progressBar.lost}%` }} title={`Lost: ${progressBar.lost.toFixed(1)}%`}></div>
                    </div>
                    <div className="text-xs mt-2 flex justify-between">
                        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>Won</span>
                        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-blue-500 mr-1.5"></span>Open</span>
                        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>Lost</span>
                    </div>
                </>
            )}
        </div>
    );
};

const FunnelChartWidget: React.FC<{ config: ChartWidgetConfig, data: CrmData }> = ({ config, data }) => {
    const { deals, stages, pipelines } = data;
    
    const { dealsForChart, stagesForChart } = useMemo(() => {
        if (!config.pipelineId) {
            return { dealsForChart: deals, stagesForChart: stages };
        }
        const sForPipeline = stages.filter(s => s.pipelineId === config.pipelineId).sort((a,b) => a.order - b.order);
        const stageIds = new Set(sForPipeline.map(s => s.id));
        const dForPipeline = deals.filter(d => stageIds.has(d.stageId));
        return { dealsForChart: dForPipeline, stagesForChart: sForPipeline };
    }, [config.pipelineId, deals, stages]);

    const chartData = stagesForChart.map(stage => ({
        name: stage.name,
        deals: dealsForChart.filter(deal => deal.stageId === stage.id && deal.status === DealStatus.OPEN).length,
        value: dealsForChart.filter(deal => deal.stageId === stage.id && deal.status === DealStatus.OPEN).reduce((sum, deal) => sum + deal.value, 0)
    })).filter(d => d.deals > 0 || d.value > 0);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-full">
            <h2 className="text-xl font-bold mb-4">{config.title}</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis yAxisId="left" orientation="left" stroke="#A0AEC0" />
                <YAxis yAxisId="right" orientation="right" stroke="#A0AEC0" tickFormatter={formatCurrency} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="deals" fill="#3B82F6" name="Deals Count" />
                <Bar yAxisId="right" dataKey="value" fill="#10B981" name="Deals Value"/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const StatusPieChartWidget: React.FC<{ config: ChartWidgetConfig, data: CrmData }> = ({ config, data }) => {
    const { deals, stages } = data;
    const COLORS = { OPEN: '#3B82F6', WON: '#10B981', LOST: '#EF4444' };
    
    const dealsForChart = useMemo(() => {
        if (!config.pipelineId) return deals;
        const stageIds = new Set(stages.filter(s => s.pipelineId === config.pipelineId).map(s => s.id));
        return deals.filter(d => stageIds.has(d.stageId));
    }, [config.pipelineId, deals, stages]);
    
    const chartData = [
        { name: 'Open', value: dealsForChart.filter(d => d.status === 'OPEN').length, color: COLORS.OPEN },
        { name: 'Won', value: dealsForChart.filter(d => d.status === 'WON').length, color: COLORS.WON },
        { name: 'Lost', value: dealsForChart.filter(d => d.status === 'LOST').length, color: COLORS.LOST },
    ].filter(d => d.value > 0);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-full">
            <h2 className="text-xl font-bold mb-4">{config.title}</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    {/* Fix: Check if 'percent' and 'name' exist before using them to format the label. */}
                    <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }: PieLabelRenderProps) => (percent !== undefined && name) ? `${name} ${(percent * 100).toFixed(0)}%` : name}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

const TasksWidget: React.FC<{ config: TasksWidgetConfig, data: CrmData }> = ({ config, data }) => {
    const { tasks } = data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate + 'T00:00:00');
            dueDate.setHours(0, 0, 0, 0);

            if (config.filter === 'overdue') {
                return !task.isCompleted && dueDate < today;
            } else { // upcoming
                return !task.isCompleted && dueDate >= today;
            }
        }).sort((a, b) => {
            if (!a.dueDate || !b.dueDate) return 0;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }, [tasks, config.filter]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-full">
            <h2 className="text-xl font-bold mb-4">{config.title}</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                    <p className="text-gray-400">No {config.filter} tasks.</p>
                ) : (
                    filteredTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                            <div>
                                <p className="text-sm text-gray-200">{task.title}</p>
                                {task.dueDate && <p className="text-xs text-gray-400">Due: {task.dueDate}</p>}
                            </div>
                            {/* Checkbox to mark as done can be added here */}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const LeaderboardWidget: React.FC<{ config: LeaderboardWidgetConfig, data: CrmData }> = ({ config, data }) => {
    const { deals, contacts } = data;

    const topDeals = useMemo(() => {
        return deals
            .filter(deal => deal.status === DealStatus.OPEN) // Only open deals
            .sort((a, b) => b.value - a.value) // Sort by value descending
            .slice(0, config.count); // Take top N
    }, [deals, config.count]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-full">
            <h2 className="text-xl font-bold mb-4">{config.title}</h2>
            <div className="space-y-3">
                {topDeals.length === 0 ? (
                    <p className="text-gray-400">No deals to display.</p>
                ) : (
                    topDeals.map((deal, index) => {
                        const contact = contacts.find(c => c.id === deal.contactId);
                        return (
                            <div key={deal.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg font-bold text-blue-400">#{index + 1}</span>
                                    <div>
                                        <p className="text-sm text-gray-200">{deal.name}</p>
                                        {contact && <p className="text-xs text-gray-400">{contact.name}</p>}
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-green-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WidgetRenderer;