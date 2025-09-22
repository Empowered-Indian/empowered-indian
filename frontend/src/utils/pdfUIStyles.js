// Shared color scheme
export const colors = {
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

// Shared base styles for PDF documents
export const createBaseStyles = (StyleSheet) => StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: colors.textPrimary,
        backgroundColor: colors.background,
        position: "relative",
    },

    // Header styles
    header: {
        background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.background} 100%)`,
        padding: "16px 24px 12px 24px",
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

    // Content area
    content: {
        padding: "8px 24px",
    },

    // Summary section styles
    summary: {
        marginBottom: 12,
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
        marginBottom: 12,
    },
    summaryIcon: {
        width: 16,
        height: 16,
        backgroundColor: colors.primary,
        borderRadius: 8,
        marginRight: 6,
    },
    linkIcon: {
        width: 12,
        height: 12,
        marginLeft: 8,
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
        backgroundColor: colors.surface,
        borderRadius: 6,
        padding: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: colors.borderLight,
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

    // Insights section styles
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

    // Chart section styles
    chart: {
        marginTop: 24,
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
    mpChart: {
        marginTop: 6,
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
    chartBarGroup: {
        flexDirection: "row",
        alignItems: "flex-end",
        width: "100%",
        justifyContent: "space-between",
    },

    // Footer styles
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        padding: "3px 32px",
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

// Export button styles for consistent UI
export const getExportButtonStyles = (loading = false) => ({
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
    background: loading ? colors.background : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
    color: loading ? colors.textMuted : colors.surface,
    border: "none",
    position: "relative",
    overflow: "hidden",
});

// Disabled button styles
export const getDisabledButtonStyles = () => ({
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
});

// Utility function for utilization bar styling
export const utilBarStyleFor = (percentage, styles) => {
    if (percentage >= 80) return styles.utilFillGreen;
    if (percentage >= 50) return styles.utilFillOrange;
    return styles.utilFillRed;
};

// Additional utility styles for specific components
export const createExtendedStyles = (StyleSheet) => StyleSheet.create({
    // Works section styles
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

    // Yearly breakdown styles
    yearlyBreakdown: {
        marginTop: 8,
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

    // Performers section styles
    performers: {
        marginTop: 6,
        flexDirection: "row",
        gap: 8,
    },
    performerCol: {
        flex: 1,
        backgroundColor: colors.borderLight,
        borderRadius: 6,
        padding: 8,
    },
    performerTitle: {
        fontSize: 10,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 6,
        textAlign: "center",
    },
    performerItem: {
        fontSize: 9,
        marginBottom: 4,
        color: colors.textPrimary,
        padding: "2px 0",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    performerItemLast: {
        fontSize: 9,
        color: colors.textPrimary,
        padding: "2px 0",
    },

    // Table styles
    table: {
        marginTop: 20,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        overflow: "hidden",
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.primary,
        padding: "8px 12px",
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: "bold",
        color: colors.surface,
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    tableRow: {
        flexDirection: "row",
        padding: "8px 12px",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    tableRowEven: {
        backgroundColor: colors.borderLight,
    },
    tableCell: {
        fontSize: 9,
        color: colors.textPrimary,
    },
    tableCellRight: {
        textAlign: "right",
    },

    // Utilization bar styles
    utilBlock: {
        width: "20%",
        alignItems: "center",
        padding: "0 4px",
    },
    utilLabel: {
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 4,
        color: colors.textPrimary,
    },
    utilBarOuter: {
        width: "100%",
        height: 8,
        backgroundColor: colors.borderLight,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
    },
    utilFillGreen: {
        height: "100%",
        backgroundColor: colors.success,
        borderRadius: 6,
    },
    utilFillOrange: {
        height: "100%",
        backgroundColor: colors.warning,
        borderRadius: 6,
    },
    utilFillRed: {
        height: "100%",
        backgroundColor: colors.accent,
        borderRadius: 6,
    },

    // Card styles for state cards
    cardsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    card: {
        borderRadius: 12,
        padding: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardShadow: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    stateLeft: {
        width: "30%",
        paddingRight: 8,
    },
    stateName: {
        fontSize: 11,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 3,
        letterSpacing: -0.1,
    },
    mpBadge: {
        backgroundColor: colors.primary,
        color: colors.surface,
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 8,
        fontWeight: "bold",
        alignSelf: "flex-start",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    metricsRight: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metricBlock: {
        width: "16%",
        alignItems: "center",
        padding: "0 2px",
    },
    metricLabel: {
        fontSize: 7,
        color: colors.textMuted,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.2,
        textAlign: "center",
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 10,
        fontWeight: "bold",
        color: colors.textPrimary,
        textAlign: "center",
    },

    // Recommendations section
    recommendations: {
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
    recTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: colors.textPrimary,
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    recItem: {
        fontSize: 9,
        color: colors.textSecondary,
        marginBottom: 4,
        paddingLeft: 8,
    },
    recBullet: {
        fontSize: 9,
        color: colors.primary,
        fontWeight: "bold",
        marginRight: 4,
    },

    // Payment Analysis section styles
    paymentAnalysis: {
        marginTop: 12,
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
    analysisHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    analysisIcon: {
        width: 18,
        height: 18,
        backgroundColor: colors.warning,
        borderRadius: 9,
        marginRight: 8,
    },
    analysisTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    analysisGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    analysisColumn: {
        flex: 1,
        paddingRight: 12,
    },
    analysisMetric: {
        marginBottom: 8,
        backgroundColor: colors.surface,
        borderRadius: 6,
        padding: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    analysisMetricLabel: {
        fontSize: 8,
        color: colors.textMuted,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    analysisMetricValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: colors.textPrimary,
    },
    analysisMetricSub: {
        fontSize: 9,
        color: colors.textSecondary,
        marginTop: 1,
    },
});