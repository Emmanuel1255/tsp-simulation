import React from 'react';
import TSPSimulation from './components/TSPSimulation';
import './styles/globals.css';

function App() {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full h-full p-4 md:p-8">
        <div className="flex justify-center mb-8">
          <h1 className="text-3xl font-bold text-center">
            Traffic Signal Priority
          </h1>
        </div>

        <TSPSimulation />

        {/* Documentation */}
        <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-sm border p-6 space-y-4 mt-8">
          <h2 className="text-xl font-semibold">About the Simulation</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Transit Signal Priority (TSP)</h3>
              <p className="text-gray-600">
                Demonstrates Transit Signal Priority along a linear corridor with multiple
                traffic signals. Buses receive priority treatment to improve public transit
                efficiency while managing general traffic flow.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Key Features:</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Real-time traffic flow visualization</li>
                <li>Adjustable simulation speed and traffic density</li>
                <li>Multiple vehicle types (cars and buses)</li>
                <li>Traffic signal coordination</li>
                <li>Comprehensive performance metrics</li>
                <li>Interactive controls for experimentation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;