interface feature {
  geometry: {
    coordinates: number[][][] | number[][][][];
    type: string;
  };
  properties: {
    Floor: number
  };
  type: string;
}

interface geoJsonData {
  features: feature[];
  type: string;
}
