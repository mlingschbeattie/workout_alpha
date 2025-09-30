import dynamic from 'next/dynamic';
const ReportsPage = dynamic(()=>import('../components/ReportBuilder'),{ssr:false});
export default ReportsPage;
