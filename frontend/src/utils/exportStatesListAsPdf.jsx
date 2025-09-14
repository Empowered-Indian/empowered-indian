import React, { useMemo, useState } from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";
import { FiDownload } from "react-icons/fi";
import { formatINRCompact } from "./formatters";

const colors = {
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  primaryDark: "#1e3a8a",
  secondary: "#059669",
  accent: "#dc2626",
  warning: "#d97706",
  success: "#16a34a",
  background: "#fafbfc",
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#64748b",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  shadow: "rgba(0, 0, 0, 0.1)",
  gradient: {
    primary: ["#1e40af", "#3b82f6"],
    secondary: ["#059669", "#10b981"],
    accent: ["#dc2626", "#ef4444"],
    neutral: ["#f8fafc", "#e2e8f0"],
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
    backgroundColor: colors.surface,
    padding: "8px 16px 6px 16px",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 1,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: "500",
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
    padding: "6px 16px",
  },

  // Enhanced summary section
  summary: {
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textPrimary,
    letterSpacing: -0.2,
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

  // performers section
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

  // cards container
  cardsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  card: {
    borderRadius: 6,
    padding: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
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

  // Enhanced utilization bar
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

  // table layout
  table: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
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

  // footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: "4px 16px",
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

const utilBarStyleFor = (p) => {
  if (p >= 80) return styles.utilFillGreen;
  if (p >= 50) return styles.utilFillOrange;
  return styles.utilFillRed;
};


// Enhanced PDF generation
export async function generatePdfWithOptions(data = [], options = {}) {
  const { fileName: fn, meta = {}, layout = "cards", orientation = "portrait" } = options;

  const fileName = fn || `empowered_indian_mplads_report_${meta.key || "all"}_${new Date().toISOString().split('T')[0]}.pdf`;
  const docNode = <MyDocument data={data} meta={meta} layout={layout} />;
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

const MyDocument = ({ data = [], meta = {}, layout = "cards" }) => {
  const timestamp = new Date().toLocaleString();
  const totalAllocated = data.reduce((sum, s) => sum + (s.totalAllocated || 0), 0);
  const totalExpenditure = data.reduce((sum, s) => sum + (s.totalExpenditure || 0), 0);
  const avgUtilization = data.length ? data.reduce((sum, s) => sum + (s.utilizationPercentage || 0), 0) / data.length : 0;
  const totalWorks = data.reduce((sum, s) => sum + (s.totalWorksCompleted || 0), 0);
  const topPerformers = [...data].sort((a, b) => (b.utilizationPercentage || 0) - (a.utilizationPercentage || 0)).slice(0, 3);
  const bottomPerformers = [...data].sort((a, b) => (a.utilizationPercentage || 0) - (b.utilizationPercentage || 0)).slice(0, 3);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation={meta.orientation || "portrait"}>
        <View style={styles.header}>
          <View style={styles.headerGradient} />
          <View style={styles.headerAccent} />
          <View style={styles.headerRow}>
            <Image style={styles.logo} src="https://avatars.githubusercontent.com/u/230681844?s=200&v=4" />
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Empowered Indian</Text>
              <Text style={styles.subtitle}>MPLADS State Performance Report</Text>
            </View>
            <View style={{ width: '135px'}}>
              <Text style={styles.timestamp}>{timestamp}</Text>
              <Text style={styles.generatedBy}>Generated by Empowered Indian</Text>
            </View>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.summary}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon} />
              <Text style={styles.summaryTitle}>Average Performance Summary</Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryColumn}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricLabel}>Total Allocated</Text>
                  <Text style={styles.summaryMetricValue}>{formatINRCompact(totalAllocated)}</Text>
                  <Text style={styles.summaryMetricSub}>Across {data.length} states</Text>
                </View>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricLabel}>Total Expenditure</Text>
                  <Text style={styles.summaryMetricValue}>{formatINRCompact(totalExpenditure)}</Text>
                  <Text style={styles.summaryMetricSub}>
                    {totalAllocated > 0 ? ((totalExpenditure / totalAllocated) * 100).toFixed(1) : 0}% of allocation
                  </Text>
                </View>
              </View>

              <View style={styles.summaryColumn}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricLabel}>Average Utilization</Text>
                  <Text style={styles.summaryMetricValue}>{avgUtilization.toFixed(1)}%</Text>
                  <Text style={styles.summaryMetricSub}>National average</Text>
                </View>
                <View style={styles.summaryMetric}>
                  <Text style={styles.summaryMetricLabel}>Total Works Completed</Text>
                  <Text style={styles.summaryMetricValue}>{totalWorks.toLocaleString()}</Text>
                  <Text style={styles.summaryMetricSub}>Projects delivered</Text>
                </View>
              </View>
            </View>

            <View style={styles.performers}>
              <View style={styles.performerCol}>
                <Text style={styles.performerTitle}>★ Top Performers</Text>
                {topPerformers.map((s, i) => (
                  <Text key={i} style={i === topPerformers.length - 1 ? styles.performerItemLast : styles.performerItem}>
                    {i + 1}. {s.state} — {String((s.utilizationPercentage || 0).toFixed(1))}%
                  </Text>
                ))}
              </View>
              <View style={styles.performerCol}>
                <Text style={styles.performerTitle}>Areas for Improvement</Text>
                {bottomPerformers.map((s, i) => (
                  <Text key={i} style={i === bottomPerformers.length - 1 ? styles.performerItemLast : styles.performerItem}>
                    {i + 1}. {s.state} — {String((s.utilizationPercentage || 0).toFixed(1))}%
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.divider} />
          {layout === "table" ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>State</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Allocated</Text>
                <Text style={[styles.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Expenditure</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Utilization</Text>
                <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Works</Text>
                <Text style={[styles.tableHeaderCell, { width: "10%", textAlign: "right" }]}>MPs</Text>
              </View>

              {data.map((s, i) => {
                const pct = Number(s.utilizationPercentage || 0);
                return (
                  <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : {}]}>
                    <Text style={[styles.tableCell, { width: "20%", fontWeight: "600" }]}>{s.state}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, { width: "20%" }]}>
                      {formatINRCompact(s.totalAllocated ?? 0)}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, { width: "20%" }]}>
                      {formatINRCompact(s.totalExpenditure ?? 0)}
                    </Text>
                    <Text style={[
                      styles.tableCell,
                      styles.tableCellRight,
                      {
                        width: "15%",
                        color: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.accent,
                        fontWeight: "bold"
                      }
                    ]}>
                      {pct.toFixed(1)}%
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, { width: "15%" }]}>
                      {s.totalWorksCompleted ?? 0}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, { width: "10%" }]}>
                      {s.mpCount ?? 0}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {data.map((s, i) => {
                const pct = Number(s.utilizationPercentage || 0);
                const fillStyle = utilBarStyleFor(pct);
                const utilColor = pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.accent;
                return (
                  <View key={i} style={styles.card}>
                    <View style={styles.stateLeft}>
                      <Text style={styles.stateName}>{s.state}</Text>
                      <Text style={styles.mpBadge}>MPS: {s.mpCount ?? 0}</Text>
                    </View>

                    <View style={styles.metricsRight}>
                      <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>ALLOCATED</Text>
                        <Text style={styles.metricValue}>{formatINRCompact(s.totalAllocated ?? 0)}</Text>
                      </View>

                      <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>EXPENDITURE</Text>
                        <Text style={styles.metricValue}>{formatINRCompact(s.totalExpenditure ?? 0)}</Text>
                      </View>

                      <View style={styles.utilBlock}>
                        <Text style={styles.metricLabel}>EXPENDITURE</Text>
                        <Text style={[styles.utilLabel, { color: utilColor }]}>
                          {pct.toFixed(1)}%
                        </Text>
                        <View style={styles.utilBarOuter}>
                          <View style={[fillStyle, { width: `${Math.max(0, Math.min(100, pct))}%` }]} />
                        </View>
                      </View>

                      <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>WORKS DONE</Text>
                        <Text style={styles.metricValue}>{s.totalWorksCompleted ?? 0}</Text>
                      </View>

                      <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>WORKs RECOMMENDED</Text>
                        <Text style={styles.metricValue}>{s.recommendedWorksCount ?? 0}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Image style={styles.footerLogo} src="https://avatars.githubusercontent.com/u/230681844?s=200&v=4" />
            <Text style={styles.footerText}>
              Generated {new Date().toLocaleString()} • Empowered Indian • https://empoweredindian.in/
            </Text>
          </View>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
};

const ExportStatesListAsPdf = React.forwardRef(({ filteredStates = [], meta = {}, layout = "cards" }, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFilteredStates, setCurrentFilteredStates] = useState(filteredStates);

  React.useEffect(() => {
    setCurrentFilteredStates(filteredStates);
  }, [filteredStates]);

  React.useImperativeHandle(ref, () => ({
    updateFilteredStates: (newStates) => {
      setCurrentFilteredStates(newStates);
    }
  }));

  if (!currentFilteredStates || currentFilteredStates.length === 0) {
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
        <FiDownload size={16} /> No data to export
      </button>
    );
  }

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await generatePdfWithOptions(currentFilteredStates, {
        fileName: `empowered_indian_mplads_report_${meta.key || "all"}_${new Date().toISOString().split('T')[0]}.pdf`,
        meta,
        layout,
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
        padding: "10px",
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 8,
        fontSize: "12px",
        fontWeight: "600",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <FiDownload />
      {loading ? "Generating PDF..." : error ? "Export Failed" : "Export PDF"}
    </button>
  );
});

export default ExportStatesListAsPdf;