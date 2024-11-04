import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Clock, Bus, Car, Plus, Minus } from 'lucide-react';

const TSPSimulation = () => {
  // Basic simulation states
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [trafficDensity, setTrafficDensity] = useState(50);
  const [priorityEnabled, setPriorityEnabled] = useState(true);

  // Vehicle states
  const [cars, setCars] = useState([]);
  const [buses, setBuses] = useState([]);

  // Statistics state
  const [stats, setStats] = useState({
    averageBusDelay: 0,
    averageBusSpeed: 0,
    signalCycles: 0,
    carsProcessed: 0,
    carsWaiting: 0,
    busesProcessed: 0,
  });

  // Traffic light states
  const [signals, setSignals] = useState([
    { id: 1, phase: 'red', location: 25 },
    { id: 2, phase: 'green', location: 50 },
    { id: 3, phase: 'red', location: 75 }
  ]);

  // Bus management functions
  const addBus = () => {
    setBuses(prev => {
      const busNearStart = prev.find(bus => bus.position < 10);
      if (busNearStart) return prev;

      return [...prev, {
        id: Date.now(),
        position: -10,
        speed: 0.2,
        isStopped: false,
        totalDelay: 0
      }];
    });
  };

  const removeBus = () => {
    if (buses.length > 0) {
      setBuses(prev => prev.slice(0, -1));
    }
  };

  // Generate new cars based on traffic density
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        if (Math.random() * 100 < trafficDensity) {
          setCars(prev => {
            const lastCar = prev.find(car => car.position < 10);
            if (!lastCar) {
              return [...prev, {
                id: Date.now(),
                position: -10,
                lane: Math.random() > 0.5 ? 0 : 1,
                speed: 1 + Math.random() * 0.5,
                baseSpeed: 1 + Math.random() * 0.5,
                isStopped: false
              }];
            }
            return prev;
          });
        }
      }, 2000 / simulationSpeed);

      return () => clearInterval(interval);
    }
  }, [isRunning, trafficDensity, simulationSpeed]);

  // Signal priority check
  const checkSignalStatus = (position) => {
    const nearestSignal = signals.find(signal =>
      Math.abs(signal.location - position) < 5
    );
    if (!nearestSignal) return true;
    return priorityEnabled || nearestSignal.phase === 'green';
  };

  const shouldVehicleStop = (position) => {
    const nearestSignal = signals.find(signal =>
      signal.location > position &&
      Math.abs(signal.location - position) < 5
    );

    if (nearestSignal && nearestSignal.phase === 'red') {
      return true;
    }
    return false;
  };

  // Update vehicles
  const updateBuses = () => {
    setBuses(prev => {
      const processedBuses = prev.map(bus => {
        if (shouldVehicleStop(bus.position) && !priorityEnabled) {
          return { ...bus, speed: 0, isStopped: true, totalDelay: bus.totalDelay + 1 };
        }

        const baseSpeed = 0.2;
        const trafficFactor = 1 - (trafficDensity / 100) * 0.5;
        const signalFactor = checkSignalStatus(bus.position) ? 1 : 0;
        const newSpeed = baseSpeed * trafficFactor * signalFactor * simulationSpeed;

        return {
          ...bus,
          position: bus.position + newSpeed,
          speed: newSpeed,
          isStopped: newSpeed === 0
        };
      });

      return processedBuses.filter(bus => bus.position <= 110);
    });
  };

  const updateCars = () => {
    setCars(prev => {
      let updatedCars = [...prev];

      updatedCars = updatedCars.map(car => {
        const shouldStop = shouldVehicleStop(car.position);

        const carAhead = updatedCars.find(
          otherCar =>
            otherCar.lane === car.lane &&
            otherCar.position > car.position &&
            otherCar.position - car.position < 5
        );

        if (shouldStop || carAhead) {
          return { ...car, speed: 0, isStopped: true };
        }

        const newSpeed = car.isStopped
          ? Math.min(car.speed + 0.1, car.baseSpeed)
          : car.baseSpeed;

        return {
          ...car,
          position: car.position + (newSpeed * simulationSpeed * 0.1),
          speed: newSpeed,
          isStopped: false
        };
      });

      return updatedCars.filter(car => car.position <= 110);
    });
  };

  // Update signals
  const updateSignals = () => {
    setSignals(prev => prev.map(signal => ({
      ...signal,
      phase: shouldChangeLightPhase(signal) ? togglePhase(signal.phase) : signal.phase
    })));
  };

  const shouldChangeLightPhase = (signal) => {
    if (priorityEnabled && buses.some(bus => Math.abs(signal.location - bus.position) < 10)) {
      return signal.phase === 'red';
    }
    return cycle % (50 * simulationSpeed) === 0;
  };

  const togglePhase = (phase) => phase === 'red' ? 'green' : 'red';

  // Update statistics
  const updateStats = () => {
    const stoppedCars = cars.filter(car => car.isStopped).length;
    const activeBuses = buses.length;
    const totalBusDelay = buses.reduce((sum, bus) => sum + bus.totalDelay, 0);
    const averageDelay = activeBuses > 0 ? totalBusDelay / activeBuses : 0;

    setStats(prev => ({
      averageBusDelay: averageDelay.toFixed(1),
      averageBusSpeed: calculateAverageBusSpeed(),
      signalCycles: cycle,
      carsProcessed: prev.carsProcessed + cars.filter(car => car.position > 100).length,
      carsWaiting: stoppedCars,
      busesProcessed: prev.busesProcessed + buses.filter(bus => bus.position > 100).length
    }));
  };

  const calculateAverageBusSpeed = () => {
    if (buses.length === 0) return '0.0';
    const totalSpeed = buses.reduce((sum, bus) => sum + bus.speed, 0);
    return (totalSpeed / buses.length * 10).toFixed(1);
  };

  // Main simulation loop
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setCycle(prev => prev + 1);
        updateBuses();
        updateCars();
        updateSignals();
        updateStats();
      }, 50 / simulationSpeed);
    }
    return () => clearInterval(timer);
  }, [isRunning, buses, signals, cars, simulationSpeed]);

  return (
    <div className="w-full">
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="text-2xl font-bold">Transit Signal Priority Simulation</div>
            <Button
              onClick={() => setIsRunning(!isRunning)}
              variant={isRunning ? "destructive" : "default"}
              className="w-32"
            >
              {isRunning ? 'Stop' : 'Start'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-6">
          {/* Control Panel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <h3 className="text-lg font-semibold mb-4">Simulation Controls</h3>

            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Simulation Speed</span>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[simulationSpeed]}
                  onValueChange={([value]) => setSimulationSpeed(value)}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{simulationSpeed.toFixed(1)}x</span>
              </div>
            </div>

            {/* Traffic Density Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Traffic Density</span>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[trafficDensity]}
                  onValueChange={([value]) => setTrafficDensity(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{trafficDensity}%</span>
              </div>
            </div>

            {/* Bus Management */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Manage Buses</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addBus}
                  variant="outline"
                  className="w-24"
                  disabled={buses.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Bus
                </Button>
                <Button
                  onClick={removeBus}
                  variant="outline"
                  className="w-24"
                  disabled={buses.length === 0}
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>

            {/* TSP Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Transit Signal Priority</span>
              </div>
              <Button
                onClick={() => setPriorityEnabled(!priorityEnabled)}
                variant={priorityEnabled ? "default" : "secondary"}
                className="w-24"
              >
                {priorityEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>

          {/* Simulation View */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Road Network</h3>
            <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
              {/* Road */}
              <div className="absolute top-1/2 w-full h-20 bg-gray-300 -translate-y-1/2">
                {/* Lane Markings */}
                <div className="absolute top-1/2 w-full h-0.5 bg-white">
                  <div className="h-full w-full bg-white dash-line" />
                </div>
              </div>

              {/* Traffic Signals */}
              {signals.map(signal => (
                <div
                  key={signal.id}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${signal.location}%` }}
                >
                  <div className="relative">
                    <div className="absolute -top-12 w-1 h-12 bg-gray-600" />
                    <div className={`w-6 h-6 rounded-full border-2 border-gray-600 ${
                      signal.phase === 'red' ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                  </div>
                </div>
              ))}

              {/* Cars */}
              {cars.map(car => (
                <div
                  key={car.id}
                  className={`absolute transition-all duration-50 ${
                    car.isStopped ? 'opacity-80' : 'opacity-100'
                  }`}
                  style={{
                    left: `${car.position}%`,
                    top: car.lane === 0 ? '60%' : '40%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Car className={`w-6 h-6 ${
                    car.isStopped ? 'text-red-600' : 'text-gray-700'
                  }`} />
                </div>
              ))}

              {/* Buses */}
              {buses.map(bus => (
                <div
                  key={bus.id}
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-100"
                  style={{ left: `${bus.position}%` }}
                >
                  <Bus className={`w-10 h-10 ${
                    bus.isStopped ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            {/* Bus Statistics */}
            <div className="col-span-3 bg-white p-4 rounded-lg shadow-sm border">
            <h4 className="text-lg font-semibold mb-3">Bus Operations</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bus className="w-5 h-5 text-blue-600" />
                    <h5 className="font-medium">Active Buses</h5>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{buses.length}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bus className="w-5 h-5 text-green-600" />
                    <h5 className="font-medium">Completed Trips</h5>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{stats.busesProcessed}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <h5 className="font-medium">Avg Delay</h5>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">{stats.averageBusDelay}s</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h5 className="font-medium">Avg Speed</h5>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{stats.averageBusSpeed} u/s</p>
                </div>
              </div>
            </div>

            {/* Traffic Statistics */}
            <div className="col-span-3 bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="text-lg font-semibold mb-3">Traffic Analysis</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-gray-600" />
                    <h5 className="font-medium">Cars Passed</h5>
                  </div>
                  <p className="text-2xl font-bold">{stats.carsProcessed}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-red-600" />
                    <h5 className="font-medium">Cars Waiting</h5>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{stats.carsWaiting}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-medium">Signal Cycles</h5>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">
                    {Math.floor(stats.signalCycles / 50)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-orange-600" />
                    <h5 className="font-medium">Traffic Flow</h5>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {trafficDensity}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend and Information */}
          <div className="space-y-4">
            {/* Legend */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-semibold mb-3">Legend</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Bus className="w-5 h-5 text-blue-600" />
                    <span>Active Bus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bus className="w-5 h-5 text-red-600" />
                    <span>Stopped Bus</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-gray-700" />
                    <span>Moving Car</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-red-600" />
                    <span>Stopped Car</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>Green Signal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span>Red Signal</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 p-4 rounded-lg text-blue-800">
              <h4 className="font-semibold mb-2">Simulation Tips:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Use the Add/Remove buttons to manage buses</li>
                <li>Adjust traffic density to simulate different conditions</li>
                <li>Toggle TSP to compare traffic flow with and without priority</li>
                <li>Change simulation speed to observe long-term patterns</li>
                <li>Watch how vehicles respond to signal changes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TSPSimulation;