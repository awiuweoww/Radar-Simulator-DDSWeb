import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Layout } from './components/layout/Layout';
import { RadarMap } from './components/map/RadarMap';
import { PerformanceStats } from './components/dashboard/PerformanceStats';
import { SimulationControls } from './components/dashboard/SimulationControls';

/**
 * Root Application component.
 * @returns {JSX.Element} The rendered React component.
 */
const App = () => (
    <Layout>
        <RadarMap />
        <PerformanceStats />
        <SimulationControls />
    </Layout>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
