import React, { useState } from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";
import { FiDownload } from "react-icons/fi";
import { formatINRCompact } from "./formatters";
import { useCompletedWorks, useRecommendedWorks, useWorkCategories, useMPWorks } from '../hooks/useApi';

// Reuse the same color scheme and base styles from exportStatesListAsPdf
const colors = {
    primary: "#007AFF", //blue
    primaryLight: "#4DA3FF",
    primaryDark: "#005BD3",
    secondary: "#34C759", //green
    accent: "#FF3B30", //red
    warning: "#FF9500", //orange
    success: "#30D158", //green
    background: "#F2F2F7", //light gray
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    textPrimary: "#1C1C1E", //dark
    textSecondary: "#3C3C43", //medium
    textMuted: "#8E8E93", //light
    border: "#C6C6C8", //border
    borderLight: "#E5E5EA", //light border
    shadow: "rgba(0, 0, 0, 0.05)", // Very subtle shadow
    gradient: {
        primary: ["#007AFF", "#4DA3FF"],
        secondary: ["#34C759", "#30D158"],
        accent: ["#FF3B30", "#FF453A"],
        neutral: ["#F2F2F7", "#E5E5EA"],
    }
};

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: colors.textPrimary,
        backgroundColor: colors.background,
        position: "relative",
    },

    // header with gradient background
    header: {
        background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.background} 100%)`,
        padding: "20px 32px 16px 32px",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        position: "relative",
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: colors.primary,
    },
    headerAccent: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 100,
        height: 4,
        backgroundColor: colors.secondary,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 6,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    titleBlock: {
        flex: 1,
        paddingTop: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
        fontWeight: "500",
        letterSpacing: -0.2,
    },
    metaInfo: {
        flexDirection: "row",
        gap: 6,
        marginTop: 2,
    },
    metaTag: {
        backgroundColor: colors.borderLight,
        color: colors.textSecondary,
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 9,
        fontWeight: "600",
    },
    timestamp: {
        fontSize: 10,
        color: colors.textMuted,
        textAlign: "right",
        fontWeight: "500",
    },
    generatedBy: {
        fontSize: 9,
        color: colors.textMuted,
        marginTop: 4
    },

    // content area
    content: {
        padding: "24px 32px",
    },

    // Enhanced summary section
    summary: {
        marginBottom: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    summaryIcon: {
        width: 16,
        height: 16,
        backgroundColor: colors.primary,
        borderRadius: 8,
        marginRight: 6,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    summaryGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    summaryColumn: {
        flex: 1,
        paddingRight: 12,
    },
    summaryMetric: {
        marginBottom: 8,
    },
    summaryMetricLabel: {
        fontSize: 8,
        color: colors.textMuted,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    summaryMetricValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: colors.textPrimary,
    },
    summaryMetricSub: {
        fontSize: 9,
        color: colors.textSecondary,
        marginTop: 1,
    },

    // Insights section
    insights: {
        marginTop: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    insightsHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    insightsIcon: {
        width: 18,
        height: 18,
        backgroundColor: colors.secondary,
        borderRadius: 9,
        marginRight: 8,
    },
    insightsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    insightsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    insightCard: {
        flex: 1,
        backgroundColor: colors.borderLight,
        borderRadius: 6,
        padding: 8,
        alignItems: "center",
    },
    insightValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 2,
    },
    insightLabel: {
        fontSize: 8,
        color: colors.textMuted,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.3,
        textAlign: "center",
    },

    // Chart section
    chart: {
        marginTop: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    chartHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    chartIcon: {
        width: 18,
        height: 18,
        backgroundColor: colors.accent,
        borderRadius: 9,
        marginRight: 8,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    chartContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        height: 120,
        marginTop: 8,
    },
    chartBar: {
        flex: 1,
        marginHorizontal: 1,
        alignItems: "center",
    },
    chartBarFill: {
        width: "100%",
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    chartLabel: {
        fontSize: 7,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: 4,
    },
    chartValue: {
        fontSize: 8,
        color: colors.textPrimary,
        fontWeight: "bold",
        position: "absolute",
        top: -12,
        width: "100%",
        textAlign: "center",
    },

    // Works section
    works: {
        marginTop: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    worksHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    worksIcon: {
        width: 18,
        height: 18,
        backgroundColor: colors.warning,
        borderRadius: 9,
        marginRight: 8,
    },
    worksTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    workItem: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: colors.borderLight,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    workTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    workDescription: {
        fontSize: 9,
        color: colors.textSecondary,
        marginBottom: 6,
        lineHeight: 1.4,
    },
    workMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    workMetaItem: {
        fontSize: 8,
        color: colors.textMuted,
        fontWeight: "600",
    },

    // Yearly breakdown section
    yearlyBreakdown: {
        marginTop: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    yearlyHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    yearlyIcon: {
        width: 18,
        height: 18,
        backgroundColor: colors.warning,
        borderRadius: 9,
        marginRight: 8,
    },
    yearlyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    yearlyItem: {
        marginBottom: 8,
        padding: 10,
        backgroundColor: colors.borderLight,
        borderRadius: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    yearlyYear: {
        fontSize: 12,
        fontWeight: "bold",
        color: colors.textPrimary,
    },
    yearlyStats: {
        fontSize: 9,
        color: colors.textSecondary,
    },

    // footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        padding: "12px 32px",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    footerLogo: {
        width: 20,
        height: 20,
        marginRight: 6,
    },
    footerText: {
        fontSize: 8,
        color: colors.textMuted,
        fontWeight: "500",
    },
    pageNumber: {
        fontSize: 8,
        color: colors.textMuted,
        fontWeight: "600",
    },

    // Utility classes
    smallText: {
        fontSize: 9,
        color: colors.textSecondary,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 6,
    },
});

// Enhanced PDF generation
export async function generateMPDetailPdf(data, options = {}) {
    const { fileName: fn } = options;
    const fileName = fn || `empowered_indian_mp_detail_${data.mp?.name?.replace(/\s+/g, '_') || 'mp'}_${new Date().toISOString().split('T')[0]}.pdf`;
    const docNode = <MPDetailDocument data={data} />;
    const asPdf = pdf(docNode, { author: "Empowered Indian" });
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = fileName;
    window.document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
}

const MPDetailDocument = ({ data }) => {
    const timestamp = new Date().toLocaleString();
    const mp = data.mp || {};
    const completedWorksData = data.completedWorks || {};
    const recommendedWorksData = data.recommendedWorks || {};

    // Calculate insights from actual data
    const allocatedAmount = mp.allocatedAmount || 0;
    const totalExpenditure = mp.totalExpenditure || 0;
    const utilizationPercentage = mp.utilizationPercentage || 0;
    const completionRate = mp.completionRate || 0;

    // Get works arrays
    const completedWorks = completedWorksData.completedWorks || [];
    const recommendedWorks = recommendedWorksData.recommendedWorks || [];

    // Calculate totals from works data
    const totalCompletedCost = completedWorksData.summary?.totalCost || 0;

    // Group works by category for better visualization
    const categoryStats = {};
    completedWorks.forEach(work => {
        const category = work.category || 'Normal/Others';
        if (!categoryStats[category]) {
            categoryStats[category] = { count: 0, totalCost: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].totalCost += work.cost || 0;
    });

    // Group works by year
    const yearlyStats = {};
    completedWorks.forEach(work => {
        const year = work.completion_year || 'Unknown';
        if (!yearlyStats[year]) {
            yearlyStats[year] = { count: 0, totalCost: 0 };
        }
        yearlyStats[year].count++;
        yearlyStats[year].totalCost += work.cost || 0;
    });

    // Prepare yearly data for chart
    const yearlyData = Object.entries(yearlyStats).map(([year, stats]) => ({
        _id: year,
        totalAmount: stats.totalCost,
        transactionCount: stats.count
    })).sort((a, b) => a._id - b._id);

    const maxYearlyAmount = Math.max(...yearlyData.map(y => y.totalAmount || 0));

    // Top categories for insights
    const topCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.totalCost - a.totalCost)
        .slice(0, 3);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerGradient} />
                    <View style={styles.headerAccent} />
                    <View style={styles.headerRow}>
                        <Image style={styles.logo} src="https://avatars.githubusercontent.com/u/230681844?s=200&v=4" />
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>Empowered Indian</Text>
                            <Text style={styles.subtitle}>MP Performance Report</Text>
                            <Text style={[styles.smallText, { marginTop: 2 }]}>Transparent • Data-Driven • Impactful</Text>
                        </View>
                        <View style={{ width: '135px' }}>
                            <Text style={styles.timestamp}>{timestamp}</Text>
                            <Text style={styles.generatedBy}>Generated by Empowered Indian</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* MP Info Header */}
                    <View style={styles.summary}>
                        <View style={styles.summaryHeader}>
                            <View style={styles.summaryIcon} />
                            <Text style={styles.summaryTitle}>{mp.name || 'MP Name'}</Text>
                        </View>
                        <Text style={[styles.smallText, { marginBottom: 8 }]}>
                            {mp.constituency || 'Constituency'} • {mp.state || 'State'} • {mp.house || 'House'}
                        </Text>

                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryColumn}>
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Allocated Amount</Text>
                                    <Text style={styles.summaryMetricValue}>{formatINRCompact(allocatedAmount)}</Text>
                                    <Text style={styles.summaryMetricSub}>Total MPLADS allocation</Text>
                                </View>
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Total Expenditure</Text>
                                    <Text style={styles.summaryMetricValue}>{formatINRCompact(totalExpenditure)}</Text>
                                    <Text style={styles.summaryMetricSub}>
                                        {utilizationPercentage.toFixed(1)}% fund utilization
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryColumn}>
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Works Completed</Text>
                                    <Text style={styles.summaryMetricValue}>{completedWorks.length}</Text>
                                    <Text style={styles.summaryMetricSub}>
                                        {completionRate.toFixed(1)}% completion rate
                                    </Text>
                                </View>
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Works Recommended</Text>
                                    <Text style={styles.summaryMetricValue}>{recommendedWorks.length}</Text>
                                    <Text style={styles.summaryMetricSub}>{mp.pendingWorks || 0} pending works</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Expenditure Chart */}
                    {yearlyData.length > 0 && (
                        <View style={styles.chart}>
                            <View style={styles.chartHeader}>
                                <View style={styles.chartIcon} />
                                <Text style={styles.chartTitle}>Yearly Expenditure Trend</Text>
                            </View>
                            <View style={styles.chartContainer}>
                                {yearlyData.map((yearData, i) => {
                                    const amount = yearData.totalAmount || 0;
                                    const height = maxYearlyAmount > 0 ? Math.max(10, (amount / maxYearlyAmount) * 100) : 10;
                                    return (
                                        <View key={i} style={styles.chartBar}>
                                            <View style={[styles.chartBarFill, { height }]}>
                                                <Text style={styles.chartValue}>{formatINRCompact(amount)}</Text>
                                            </View>
                                            <Text style={styles.chartLabel}>{yearData._id}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Yearly Breakdown */}
                    {yearlyData.length > 0 && (
                        <View style={styles.yearlyBreakdown}>
                            <View style={styles.yearlyHeader}>
                                <View style={styles.yearlyIcon} />
                                <Text style={styles.yearlyTitle}>Yearly Performance Breakdown</Text>
                            </View>
                            {yearlyData.map((yearData, i) => (
                                <View key={i} style={styles.yearlyItem}>
                                    <Text style={styles.yearlyYear}>{yearData._id}</Text>
                                    <View>
                                        <Text style={styles.yearlyStats}>
                                            {yearData.transactionCount} works • {formatINRCompact(yearData.totalAmount)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Category Breakdown */}
                    {Object.keys(categoryStats).length > 0 && (
                        <View style={styles.works}>
                            <View style={styles.worksHeader}>
                                <View style={styles.worksIcon} />
                                <Text style={styles.worksTitle}>Work Categories Breakdown</Text>
                            </View>
                            {topCategories.map(([category, stats], i) => (
                                <View key={i} style={styles.workItem}>
                                    <Text style={styles.workTitle}>{category}</Text>
                                    <Text style={styles.workDescription}>
                                        {stats.count} works • Total cost: {formatINRCompact(stats.totalCost)}
                                    </Text>
                                    <View style={styles.workMeta}>
                                        <Text style={styles.workMetaItem}>
                                            Average: {formatINRCompact(stats.totalCost / stats.count)}
                                        </Text>
                                        <Text style={styles.workMetaItem}>
                                            {((stats.totalCost / totalExpenditure) * 100).toFixed(1)}% of total
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Completed Works */}
                    {completedWorks.length > 0 && (
                        <View style={styles.works}>
                            <View style={styles.worksHeader}>
                                <View style={styles.worksIcon} />
                                <Text style={styles.worksTitle}>Completed Works ({completedWorks.length})</Text>
                            </View>
                            {completedWorks.map((work, i) => (
                                <View key={i} style={styles.workItem}>
                                    <Text style={styles.workTitle}>{work.category || 'Work'}</Text>
                                    <Text style={styles.workDescription}>{work.work_description || 'No description'}</Text>
                                    <View style={styles.workMeta}>
                                        <Text style={styles.workMetaItem}>
                                            Completed: {new Date(work.completion_date).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.workMetaItem}>
                                            Amount: {formatINRCompact(work.cost || 0)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Recommended Works */}
                    {recommendedWorks.length > 0 && (
                        <View style={styles.works}>
                            <View style={styles.worksHeader}>
                                <View style={styles.worksIcon} />
                                <Text style={styles.worksTitle}>Recommended Works ({recommendedWorks.length})</Text>
                            </View>
                            {recommendedWorks.slice(0, 5).map((work, i) => (
                                <View key={i} style={styles.workItem}>
                                    <Text style={styles.workTitle}>{work.category || 'Work'}</Text>
                                    <Text style={styles.workDescription}>{work.work_description || 'No description'}</Text>
                                    <View style={styles.workMeta}>
                                        <Text style={styles.workMetaItem}>
                                            Recommended: {new Date(work.recommendationDate || work.createdAt).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.workMetaItem}>
                                            Amount: {formatINRCompact(work.recommendedAmount || work.totalPaid || 0)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            {recommendedWorks.length > 5 && (
                                <Text style={[styles.smallText, { textAlign: 'center', marginTop: 8 }]}>
                                    ... and {recommendedWorks.length - 5} more recommended works
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                        <Image style={styles.footerLogo} src="https://avatars.githubusercontent.com/u/230681844?s=200&v=4" />
                        <Text style={[styles.smallText, { marginTop: 2, fontSize: 7 }]}>
                            * Data sourced from official MPLADS records. For latest updates, visit empoweredindian.in
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

const ExportMPsDetailAsPdf = ({ mpData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mpComWorksParams = {
        state: mpData?.state || '',
        constituency: mpData?.constituency || '',
        status: 'Completed'
    };

    const mpRecWorksParams = {
        state: mpData?.state || '',
        constituency: mpData?.constituency || '',
        status: 'In Progress'
    };

    const completedWorks = useCompletedWorks(mpComWorksParams);
    const recommendedWorks = useRecommendedWorks(mpRecWorksParams);

    const data = {
        mp: mpData,
        completedWorks: completedWorks?.data?.data ? completedWorks?.data?.data : completedWorks?.data,
        recommendedWorks: recommendedWorks?.data?.data ? recommendedWorks?.data?.data : recommendedWorks?.data
    }

    console.log("ExportMPsDetailAsPdf mpData:", data);

    if (!data) {
        return (
            <button
                disabled
                style={{
                    display: "inline-flex",
                    gap: 8,
                    width: '135px',
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: 8,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "not-allowed",
                    opacity: 0.6,
                    transition: "all 0.2s ease",
                }}
            >
                <FiDownload /> No data to export
            </button>
        );
    }

    const handleClick = async () => {
        setError(null);
        setLoading(true);
        try {
            await generateMPDetailPdf(data, {
                fileName: `empowered_indian_mp_detail_${data.mp?.name?.replace(/\s+/g, '_') || 'mp'}_${new Date().toISOString().split('T')[0]}.pdf`
            });
        } catch (e) {
            console.error("PDF generation failed", e);
            setError("Failed to generate PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            style={{
                padding: "12px 24px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: 12,
                fontSize: "15px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.2s ease",
                boxShadow: loading ? "none" : "0 2px 8px rgba(0, 122, 255, 0.2)",
                background: loading ? "#F2F2F7" : "linear-gradient(135deg, #007AFF 0%, #4DA3FF 100%)",
                color: loading ? "#8E8E93" : "#FFFFFF",
                border: "none",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <FiDownload />
            {loading ? "Generating PDF..." : error ? "Export Failed" : "Download Report"}
        </button>
    );
};

export default ExportMPsDetailAsPdf;