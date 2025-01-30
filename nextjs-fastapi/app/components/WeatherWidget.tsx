type WeatherData = {
  name: string;
  weather: { description: string }[];
  main: { temp: number };
};


export default function WeatherWidget({ weather }: { weather: WeatherData }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold">Weather in {weather.name}</h2>
      <p className="text-sm">Condition: {weather.weather[0].description}</p>
      <p className="text-sm">Temperature: {weather.main.temp}°C</p>
    </div>
  );
}
