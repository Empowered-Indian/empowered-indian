import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from "@react-pdf/renderer";
import { FiDownload } from "react-icons/fi";
import { formatINRCompact } from "./formatters";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  coverPage: { flex: 1, justifyContent: "center", alignItems: "center", textAlign: "center" },
  coverTitle: { fontSize: 20, fontWeight: "bold", alignItems: "center", textAlign: "center" },
  coverSubtitle: { fontSize: 14, marginBottom: 20, alignItems: "center", textAlign: "center" },
  header: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  logo: { width: 60, height: 60, borderRadius: 30 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "center", flex: 1 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, marginBottom: 6, fontWeight: "bold", textDecoration: "underline" },
  listItem: { fontSize: 10, marginBottom: 3 },
  table: { display: "table", width: "auto", marginTop: 10, borderWidth: 1, borderColor: "#000" },
  row: { flexDirection: "row" },
  colHeader: {
    width: "14.28%", borderStyle: "solid", borderWidth: 1, borderColor: "#000",
    backgroundColor: "#1f2937", color: "white", padding: 4, fontWeight: "bold", textAlign: "center"
  },
  col: {
    width: "14.28%", borderStyle: "solid", borderWidth: 1, borderColor: "#ccc",
    padding: 4, textAlign: "center"
  },
  colAlt: { backgroundColor: "#f9f9f9" }, // zebra rows
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, fontSize: 9, textAlign: "center", color: "gray" },
});

// --- Main Document ---
const MyDocument = ({ data }) => {
  const timestamp = new Date().toLocaleString();

  // National totals
  const totalAllocated = data.reduce((sum, s) => sum + (s.totalAllocated || 0), 0);
  const totalExpenditure = data.reduce((sum, s) => sum + (s.totalExpenditure || 0), 0);
  const avgUtilization = data.reduce((sum, s) => sum + (s.utilizationPercentage || 0), 0) / data.length;

  // Top 3 performers
  const topPerformers = [...data]
    .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
    .slice(0, 3);

  // Bottom 3 performers
  const bottomPerformers = [...data]
    .sort((a, b) => a.utilizationPercentage - b.utilizationPercentage)
    .slice(0, 3);

  return (
    <Document>
      {/* Detailed Table */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="https://avatars.githubusercontent.com/u/230681844?s=200&v=4" style={styles.logo} />
          <Text style={styles.coverTitle}>Empowered Indian • MPLADS Report</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.colHeader}>State</Text>
            <Text style={styles.colHeader}>MP Count</Text>
            <Text style={styles.colHeader}>Allocated</Text>
            <Text style={styles.colHeader}>Expenditure</Text>
            <Text style={styles.colHeader}>Utilization</Text>
            <Text style={styles.colHeader}>Works Completed</Text>
            <Text style={styles.colHeader}>Works Recommended</Text>
          </View>
          {data.map((item, i) => (
            <View key={i} style={[styles.row, i % 2 === 0 ? styles.colAlt : null]}>
              <Text style={styles.col}>{item.state}</Text>
              <Text style={styles.col}>{item.mpCount}</Text>
              <Text style={styles.col}>{formatINRCompact(item.totalAllocated)}</Text>
              <Text style={styles.col}>{formatINRCompact(item.totalExpenditure)}</Text>
              <Text
                style={[
                  styles.col,
                  { color: item.utilizationPercentage > 70 ? "green" : item.utilizationPercentage > 30 ? "orange" : "red" }
                ]}
              >
                {item.utilizationPercentage?.toFixed(1)}%
              </Text>
              <Text style={styles.col}>{item.totalWorksCompleted}</Text>
              <Text style={styles.col}>{item.recommendedWorksCount}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>National Summary</Text>
          <Text>Total Allocated: {formatINRCompact(totalAllocated)}</Text>
          <Text>Total Expenditure: {formatINRCompact(totalExpenditure)}</Text>
          <Text>Average Utilization: {avgUtilization.toFixed(1)}%</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 3 High Performers</Text>
          {topPerformers.map((s, i) => (
            <Text key={i} style={styles.listItem}>
              {i + 1}. {s.state} — {s.utilizationPercentage.toFixed(1)}%
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bottom 3 Low Performers</Text>
          {bottomPerformers.map((s, i) => (
            <Text key={i} style={styles.listItem}>
              {i + 1}. {s.state} — {s.utilizationPercentage.toFixed(1)}%
            </Text>
          ))}
        </View>
        <Text style={styles.footer}>Generated {timestamp} • https://empoweredindian.in/</Text>
      </Page>
    </Document>
  );
};

const ExportPdfButton = ({ filteredStates }) => (
  <PDFDownloadLink document={<MyDocument data={filteredStates} />} fileName="states_report.pdf">
    {({ loading }) => (
      <button>
        <FiDownload />Export PDF
      </button>
    )}
  </PDFDownloadLink>
);

export default ExportPdfButton;