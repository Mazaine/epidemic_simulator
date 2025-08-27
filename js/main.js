 // DOM Elements
        const simulationArea = document.getElementById('simulation-area');
        const startBtn = document.getElementById('start-btn');
        const resetBtn = document.getElementById('reset-btn');
        const dayCounter = document.getElementById('day-counter');
        
        // Population counters
        const healthyCount = document.getElementById('healthy-count');
        const infectedCount = document.getElementById('infected-count');
        const recoveredCount = document.getElementById('recovered-count');
        const deceasedCount = document.getElementById('deceased-count');
        
        // Sliders and their value displays
        const populationSize = document.getElementById('population-size');
        const populationValue = document.getElementById('population-value');
        const initialInfected = document.getElementById('initial-infected');
        const initialInfectedValue = document.getElementById('initial-infected-value');
        const infectionRate = document.getElementById('infection-rate');
        const infectionRateValue = document.getElementById('infection-rate-value');
        const recoveryTime = document.getElementById('recovery-time');
        const recoveryTimeValue = document.getElementById('recovery-time-value');
        const mortalityRate = document.getElementById('mortality-rate');
        const mortalityRateValue = document.getElementById('mortality-rate-value');
        
        // Simulation variables
        let people = [];
        let simulationRunning = false;
        let day = 0;
        let simulationInterval;
        let chart;
        
        // Statistics tracking
        let stats = {
            days: [],
            healthy: [],
            infected: [],
            recovered: [],
            deceased: []
        };
        
        // Update slider value displays
        populationSize.addEventListener('input', () => {
            populationValue.textContent = populationSize.value;
        });
        
        initialInfected.addEventListener('input', () => {
            initialInfectedValue.textContent = initialInfected.value;
        });
        
        infectionRate.addEventListener('input', () => {
            infectionRateValue.textContent = `${infectionRate.value}%`;
        });
        
        recoveryTime.addEventListener('input', () => {
            recoveryTimeValue.textContent = recoveryTime.value;
        });
        
        mortalityRate.addEventListener('input', () => {
            mortalityRateValue.textContent = `${mortalityRate.value}%`;
        });
        
        // Person class
        class Person {
            constructor(id, status = 'healthy') {
                this.id = id;
                this.status = status;
                this.daysInfected = 0;
                this.element = document.createElement('div');
                this.element.className = `person ${status}`;
                this.element.id = `person-${id}`;
                
                // Random position within simulation area
                const areaWidth = simulationArea.clientWidth - 10;
                const areaHeight = simulationArea.clientHeight - 10;
                this.x = Math.random() * areaWidth;
                this.y = Math.random() * areaHeight;
                
                this.element.style.left = `${this.x}px`;
                this.element.style.top = `${this.y}px`;
                
                simulationArea.appendChild(this.element);
            }
            
            updatePosition() {
                // Random movement
                this.x += (Math.random() - 0.5) * 5;
                this.y += (Math.random() - 0.5) * 5;
                
                // Boundary checks
                const areaWidth = simulationArea.clientWidth - 10;
                const areaHeight = simulationArea.clientHeight - 10;
                
                if (this.x < 0) this.x = 0;
                if (this.x > areaWidth) this.x = areaWidth;
                if (this.y < 0) this.y = 0;
                if (this.y > areaHeight) this.y = areaHeight;
                
                this.element.style.left = `${this.x}px`;
                this.element.style.top = `${this.y}px`;
            }
            
            checkInfection(people) {
                if (this.status !== 'healthy') return;
                
                // Check proximity to infected people
                for (const person of people) {
                    if (person.status === 'infected') {
                        const dx = this.x - person.x;
                        const dy = this.y - person.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // If within infection range (20px) and random chance based on infection rate
                        if (distance < 20 && Math.random() * 100 < parseInt(infectionRate.value)) {
                            this.infect();
                            break;
                        }
                    }
                }
            }
            
            infect() {
                this.status = 'infected';
                this.daysInfected = 0;
                this.element.className = 'person infected';
            }
            
            updateStatus() {
                if (this.status === 'infected') {
                    this.daysInfected++;
                    
                    // Check for recovery or death
                    if (this.daysInfected >= parseInt(recoveryTime.value)) {
                        const deathChance = Math.random() * 100;
                        
                        if (deathChance < parseInt(mortalityRate.value)) {
                            this.status = 'deceased';
                            this.element.className = 'person deceased';
                        } else {
                            this.status = 'recovered';
                            this.element.className = 'person recovered';
                        }
                    }
                }
            }
        }
        
        // Initialize simulation
        function initSimulation() {
            // Clear previous simulation
            simulationArea.innerHTML = '';
            people = [];
            day = 0;
            dayCounter.textContent = day;
            
            // Reset stats
            stats = {
                days: [],
                healthy: [],
                infected: [],
                recovered: [],
                deceased: []
            };
            
            // Create population
            const population = parseInt(populationSize.value);
            const initialInfectedCount = parseInt(initialInfected.value);
            
            for (let i = 0; i < population; i++) {
                const status = i < initialInfectedCount ? 'infected' : 'healthy';
                people.push(new Person(i, status));
            }
            
            updateCounters();
            updateChart();
        }
        
        // Run simulation step
        function runSimulationStep() {
            day++;
            dayCounter.textContent = day;
            
            // Update each person
            for (const person of people) {
                person.updatePosition();
                person.checkInfection(people);
                person.updateStatus();
            }
            
            updateCounters();
            
            // Check if epidemic is over
            const infectedCount = people.filter(p => p.status === 'infected').length;
            if (infectedCount === 0) {
                stopSimulation();
                startBtn.textContent = 'Epidemic Ended';
                startBtn.disabled = true;
            }
        }
        
        // Update population counters
        function updateCounters() {
            const healthy = people.filter(p => p.status === 'healthy').length;
            const infected = people.filter(p => p.status === 'infected').length;
            const recovered = people.filter(p => p.status === 'recovered').length;
            const deceased = people.filter(p => p.status === 'deceased').length;
            
            healthyCount.textContent = healthy;
            infectedCount.textContent = infected;
            recoveredCount.textContent = recovered;
            deceasedCount.textContent = deceased;
            
            // Update stats for chart
            stats.days.push(day);
            stats.healthy.push(healthy);
            stats.infected.push(infected);
            stats.recovered.push(recovered);
            stats.deceased.push(deceased);
            
            updateChart();
        }
        
        // Initialize chart
        function initChart() {
            const ctx = document.getElementById('epidemic-chart').getContext('2d');
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: stats.days,
                    datasets: [
                        {
                            label: 'Healthy',
                            data: stats.healthy,
                            borderColor: '#4ade80',
                            backgroundColor: 'rgba(74, 222, 128, 0.1)',
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Infected',
                            data: stats.infected,
                            borderColor: '#f87171',
                            backgroundColor: 'rgba(248, 113, 113, 0.1)',
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Recovered',
                            data: stats.recovered,
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            tension: 0.1,
                            fill: true
                        },
                        {
                            label: 'Deceased',
                            data: stats.deceased,
                            borderColor: '#6b7280',
                            backgroundColor: 'rgba(107, 114, 128, 0.1)',
                            tension: 0.1,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of People'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Days'
                            }
                        }
                    },
                    animation: {
                        duration: 0
                    }
                }
            });
        }
        
        // Update chart data
        function updateChart() {
            if (!chart) {
                initChart();
                return;
            }
            
            chart.data.labels = stats.days;
            chart.data.datasets[0].data = stats.healthy;
            chart.data.datasets[1].data = stats.infected;
            chart.data.datasets[2].data = stats.recovered;
            chart.data.datasets[3].data = stats.deceased;
            chart.update();
        }
        
        // Start simulation
        function startSimulation() {
            if (simulationRunning) return;
            
            simulationRunning = true;
            startBtn.innerHTML = '<i class="fas fa-pause mr-2"></i> Pause';
            startBtn.classList.remove('bg-blue-600');
            startBtn.classList.add('bg-yellow-500');
            
            simulationInterval = setInterval(runSimulationStep, 500);
        }
        
        // Stop simulation
        function stopSimulation() {
            simulationRunning = false;
            clearInterval(simulationInterval);
            
            startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Resume';
            startBtn.classList.remove('bg-yellow-500');
            startBtn.classList.add('bg-blue-600');
        }
        
        // Event listeners
        startBtn.addEventListener('click', () => {
            if (simulationRunning) {
                stopSimulation();
            } else {
                // If first run, initialize
                if (people.length === 0) {
                    initSimulation();
                }
                startSimulation();
            }
        });
        
        resetBtn.addEventListener('click', () => {
            stopSimulation();
            initSimulation();
            startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Start Simulation';
            startBtn.classList.remove('bg-yellow-500');
            startBtn.classList.add('bg-blue-600');
            startBtn.disabled = false;
        });
        
        // Initialize on load
        document.addEventListener('DOMContentLoaded', initSimulation);