import React, { useState } from "react";
import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer";
import { FiDownload } from "react-icons/fi";
import { formatINRCompact } from "./formatters";
import { useMPWorks } from '../hooks/useApi';
import { createBaseStyles, createExtendedStyles, getExportButtonStyles, getDisabledButtonStyles, colors } from "./pdfUIStyles";
import { generateAndDownloadPdf } from "./pdfGenerator";
import { PaymentIcon, ChartIcon, CompletedWorkIcon, RecommendedWorkIcon, MPIcon } from '../assets/svgIcon';

const baseStyles = createBaseStyles(StyleSheet);
const extendedStyles = createExtendedStyles(StyleSheet);
const styles = { ...baseStyles, ...extendedStyles };

const MPDetailDocument = ({ data }) => {
    const timestamp = new Date().toLocaleString();
    const mp = data.mp || {};

    // Get current URL for checkout link
    const currentUrl = `${window.location.origin}${window.location.pathname}`;
    const completedWorksData = data.completedWorks || {};
    const recommendedWorksData = data.recommendedWorks || {};
    const allocatedAmount = mp.allocatedAmount || 0;
    const totalExpenditure = mp.totalExpenditure || 0;
    const utilizationPercentage = mp.utilizationPercentage || 0;
    const completionRate = mp.completionRate || 0;
    const inProgressPayments = mp.inProgressPayments || 0;
    const paymentGapPercentage = mp.paymentGapPercentage || 0;
    const unspentAmount = mp.unspentAmount || 0;
    const pendingWorks = mp.pendingWorks || 0;

    const utilizationColor = utilizationPercentage >= 80 ? colors.success : utilizationPercentage >= 50 ? colors.warning : colors.accent;
    const completionColor = completionRate >= 80 ? colors.success : completionRate >= 50 ? colors.warning : colors.accent;
    const paymentGapColor = paymentGapPercentage <= 10 ? colors.success : paymentGapPercentage <= 25 ? colors.warning : colors.accent;
    // Get works arrays - handle both direct payload structure and nested structure
    let completedWorks = completedWorksData.works || completedWorksData.completedWorks || [];
    let recommendedWorks = recommendedWorksData.works || recommendedWorksData.recommendedWorks || [];

    // Sort completed works by finalAmount (highest first) and take top 5
    let completedWorksSliced = completedWorks.slice(0, 5);

    // Sort recommended works by recommendedAmount (highest first) and take top 5
    let recommendedWorksSliced = recommendedWorks.slice(0, 5);

    // Helper functions to get consistent data from works
    const getWorkAmount = (work) => work.finalAmount || work.recommendedAmount || work.totalPaid || 0;
    const getWorkDate = (work) => work.completedDate || work.recommendationDate || work.date;

    // Combine all works for stats calculation
    const allWorks = [...completedWorks, ...recommendedWorks];

    const categoryStats = {};
    allWorks.forEach(work => {
        const category = work.workCategory || 'Normal/Others';
        const amount = getWorkAmount(work);
        if (!categoryStats[category]) {
            categoryStats[category] = { count: 0, totalCost: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].totalCost += amount;
    });

    // Group works by year
    const yearlyStats = {};
    allWorks.forEach(work => {
        const date = getWorkDate(work);
        const year = date ? new Date(date).getFullYear().toString() : 'Unknown';
        const amount = getWorkAmount(work);
        if (!yearlyStats[year]) {
            yearlyStats[year] = { count: 0, totalCost: 0 };
        }
        yearlyStats[year].count++;
        yearlyStats[year].totalCost += amount;
    });

    // Prepare yearly data for chart
    const yearlyData = Object.entries(yearlyStats).map(([year, stats]) => ({
        _id: year,
        totalAmount: stats.totalCost,
        transactionCount: stats.count
    })).sort((a, b) => a._id - b._id);

    const maxYearlyCount = Math.max(...yearlyData.map(y => y.transactionCount || 0));
    const maxYearlyAmount = Math.max(...yearlyData.map(y => y.totalAmount || 0));

    return (
        <Document>
            {/* First Page - MP Overview and Completed Works */}
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
                        <View style={{ width: '130px' }}>
                            <Text style={styles.timestamp}>{timestamp}</Text>
                            <Text style={styles.generatedBy}>Generated by Empowered Indian</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* MP Info Header */}
                    <View style={styles.summary}>
                        <View style={styles.summaryHeader}>
                            <MPIcon />
                            <Text style={styles.summaryTitle}>{mp.name || 'MP Name'}</Text>
                            <Link src={currentUrl} style={{ color: '#007AFF', textDecoration: 'underline', fontSize: 9, marginBottom: 4 }}>
                                <Image
                                    src="https://img.icons8.com/?size=100&id=xPX4qmtKvtBp&format=png&color=000000"
                                    style={styles.linkIcon}
                                />
                            </Link>
                        </View>
                        <Text style={[styles.smallText, { marginBottom: 4 }]}>
                            {mp.constituency || 'Constituency'} • {mp.state || 'State'} • {mp.house !== 'Rajya Sabha' ? mp.house : ''}
                        </Text>
                        {/* Hindi translations if available */}
                        {(mp.name_hi || mp.constituency_hi || mp.state_hi) && (
                            <Text style={[styles.smallText, { marginBottom: 8, fontSize: 8, color: '#666' }]}>
                                {mp.name_hi && mp.name_hi !== mp.name ? `${mp.name_hi} • ` : ''}
                                {mp.constituency_hi && mp.constituency_hi !== mp.constituency ? `${mp.constituency_hi} • ` : ''}
                                {mp.state_hi && mp.state_hi !== mp.state ? mp.state_hi : ''}
                            </Text>
                        )}

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
                                        <Text style={{ color: utilizationColor }}>{utilizationPercentage.toFixed(1)}%</Text> fund utilization
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryColumn}>
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Total Works</Text>
                                    <Text style={styles.summaryMetricValue}>{mp.completedWorksCount + mp.recommendedWorksCount}</Text>
                                    <Text style={styles.summaryMetricSub}>
                                        <Text style={{ color: completionColor }}>{completionRate.toFixed(1)}%</Text> completion rate
                                    </Text>
                                </View>
                                <View style={styles.summaryMetric}>
                                    <Text style={styles.summaryMetricLabel}>Works Completed</Text>
                                    <Text style={styles.summaryMetricValue}>{mp.completedWorksCount}</Text>
                                    <Text style={styles.summaryMetricSub}>{mp.recommendedWorksCount || 0} pending works</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Payment Analysis Section */}
                    <View style={styles.paymentAnalysis}>
                        <View style={styles.analysisHeader}>
                            <PaymentIcon />
                            <Text style={styles.analysisTitle}>Payment Analysis</Text>
                        </View>
                        <View style={styles.analysisGrid}>
                            <View style={styles.analysisColumn}>
                                <View style={styles.analysisMetric}>
                                    <Text style={styles.analysisMetricLabel}>Unspent Amount</Text>
                                    <Text style={styles.analysisMetricValue}>{formatINRCompact(unspentAmount)}</Text>
                                    <Text style={styles.analysisMetricSub}>Remaining allocation</Text>
                                </View>
                                <View style={styles.analysisMetric}>
                                    <Text style={styles.analysisMetricLabel}>In-Progress Payments</Text>
                                    <Text style={styles.analysisMetricValue}>{formatINRCompact(inProgressPayments)}</Text>
                                    <Text style={styles.analysisMetricSub}>Funds committed but incomplete</Text>
                                </View>
                            </View>
                            <View style={styles.analysisColumn}>
                                <View style={styles.analysisMetric}>
                                    <Text style={styles.analysisMetricLabel}>Payment Gap</Text>
                                    <Text style={[styles.analysisMetricValue, { color: paymentGapColor }]}>
                                        {paymentGapPercentage.toFixed(1)}%
                                    </Text>
                                    <Text style={styles.analysisMetricSub}>Unaccounted spending</Text>
                                </View>
                                <View style={styles.analysisMetric}>
                                    <Text style={styles.analysisMetricLabel}>Pending Works</Text>
                                    <Text style={styles.analysisMetricValue}>
                                        {pendingWorks > 0 ? pendingWorks : 0}
                                    </Text>
                                    <Text style={styles.analysisMetricSub}>Works awaiting completion</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Yearly Trends */}
                    {yearlyData.length > 0 && (
                        <View style={styles.chart}>
                            <View style={styles.chartHeader}>
                                <ChartIcon />
                                <Text style={styles.chartTitle}>Yearly Trends</Text>
                            </View>
                            <View style={styles.chartContainer}>
                                {yearlyData.map((yearData, i) => {
                                    const count = yearData.transactionCount || 0;
                                    const amount = yearData.totalAmount || 0;
                                    const countHeight = maxYearlyCount > 0 ? Math.max(10, (count / maxYearlyCount) * 100) : 10;
                                    const amountHeight = maxYearlyAmount > 0 ? Math.max(10, (amount / maxYearlyAmount) * 100) : 10;
                                    return (
                                        <View key={i} style={styles.chartBar}>
                                            <View style={styles.chartBarGroup}>
                                                <View style={[styles.chartBarFill, { height: countHeight, backgroundColor: '#007bff', flex: 1, marginRight: 1 }]}>
                                                    <Text style={styles.chartValue}>{count} Works</Text>
                                                </View>
                                                <View style={[styles.chartBarFill, { height: amountHeight, backgroundColor: '#28a745', flex: 1, marginLeft: 1 }]}>
                                                    <Text style={styles.chartValue}>{formatINRCompact(amount)}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.chartLabel}>{yearData._id}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>
            </Page>

            {/* Completed Works - Always show top 5 if available */}
            {completedWorksSliced.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.content}>
                        <View style={styles.works}>
                            <View style={styles.worksHeader}>
                                <CompletedWorkIcon />
                                <Text style={styles.worksTitle}>Recent Completed Works</Text>
                            </View>
                            {completedWorksSliced.map((work, i) => (
                                <View key={i} style={styles.workItem}>
                                    <Text style={styles.workTitle}>{work.workCategory || 'Work'}</Text>
                                    <Text style={styles.workDescription}>{work.workDescription || 'No description'}</Text>
                                    <View style={styles.workMeta}>
                                        <Text style={styles.workMetaItem}>
                                            Completed: {new Date(work.completedDate || work.date).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.workMetaItem}>
                                            Amount: {formatINRCompact(work.finalAmount || 0)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                    {recommendedWorksSliced.length === 0 && (
                        <View style={styles.footer}>
                            <View style={styles.footerLeft}>
                                <Image style={styles.footerLogo} src="https://avatars.githubusercontent.com/u/230681844?s=200&v=4" />
                                <Text style={[styles.smallText, { marginTop: 2, fontSize: 7 }]}>
                                    * Data sourced from official MPLADS records. For latest updates, visit empoweredindian.in
                                </Text>
                            </View>
                        </View>
                    )}
                </Page>
            )}

            {/* Recommended Works - Always show top 5 if available */}
            {recommendedWorksSliced.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.content}>
                        <View style={styles.works}>
                            <View style={styles.worksHeader}>
                                <RecommendedWorkIcon />
                                <Text style={styles.worksTitle}>Top Recommended / In-Progress Works</Text>
                            </View>
                            {recommendedWorksSliced.map((work, i) => (
                                <View key={i} style={styles.workItem}>
                                    <Text style={styles.workTitle}>{work.workCategory || 'Work'}</Text>
                                    <Text style={styles.workDescription}>{work.workDescription || 'No description'}</Text>
                                    <View style={styles.workMeta}>
                                        <Text style={styles.workMetaItem}>
                                            Recommended: {new Date(work.recommendationDate || work.date).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.workMetaItem}>
                                            Amount: {formatINRCompact(work.recommendedAmount || work.totalPaid || 0)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                    {completedWorksSliced.length !== 0 && (
                        <View style={styles.footer}>
                            <View style={styles.footerLeft}>
                                <Image style={styles.footerLogo} src="https://avatars.githubusercontent.com/u/230681844?s=200&v=4" />
                                <Text style={[styles.smallText, { marginTop: 2, fontSize: 7 }]}>
                                    * Data sourced from official MPLADS records. For latest updates, visit empoweredindian.in
                                </Text>
                            </View>
                        </View>
                    )}
                </Page>
            )}
        </Document>
    );
};

const ExportMPsDetailAsPdf = ({ mpData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mpComWorksParams = {
        state: mpData?.state || '',
        constituency: mpData?.constituency || '',
        status: 'completed'
    };

    const mpRecWorksParams = {
        state: mpData?.state || '',
        constituency: mpData?.constituency || '',
        status: 'recommended'
    };

    const completedWorks = useMPWorks(mpData.id, mpComWorksParams);
    const recommendedWorks = useMPWorks(mpData.id, mpRecWorksParams);

    const data = {
        mp: mpData,
        completedWorks: completedWorks?.data?.data ? completedWorks?.data?.data : completedWorks?.data,
        recommendedWorks: recommendedWorks?.data?.data ? recommendedWorks?.data?.data : recommendedWorks?.data
    }

    // Removed console.log for production

    if (!data) {
        return (
            <button
                disabled
                style={getDisabledButtonStyles()}
            >
                <FiDownload /> No data to export
            </button>
        );
    }

    const handleClick = async () => {
        setError(null);
        setLoading(true);
        try {
            const fileName = `empowered_indian_mp_detail_${data.mp?.name?.replace(/\s+/g, '_') || 'mp'}_${new Date().toISOString().split('T')[0]}.pdf`;
            const docNode = <MPDetailDocument data={data} />;
            await generateAndDownloadPdf(docNode, fileName);
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
            style={getExportButtonStyles(loading)}
        >
            <FiDownload />
            {loading ? "Generating PDF..." : error ? "Export Failed" : "Download Report"}
        </button>
    );
};

export default ExportMPsDetailAsPdf;