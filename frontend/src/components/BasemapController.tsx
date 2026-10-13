import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { BasemapType } from '../types';
import { getBasemapDefinition } from '../services/basemapConfig';

interface BasemapControllerProps {
  activeBasemap: BasemapType;
  onLoadingChange?: (loading: boolean, targetStyle: BasemapType | null) => void;
  onStyleApplied?: (appliedStyle: BasemapType) => void;
  onError?: (failedStyle: BasemapType, errorMsg: string) => void;
}

export const BasemapController: React.FC<BasemapControllerProps> = ({
  activeBasemap,
  onLoadingChange,
  onStyleApplied,
  onError,
}) => {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentAppliedStyleRef = useRef<BasemapType | null>(null);
  const fallbackWorkingStyleRef = useRef<BasemapType>('satellite');
  const sequenceIdRef = useRef<number>(0);
  const timeoutIdRef = useRef<any>(null);

  // Initialize dedicated basemap layer group on mount
  useEffect(() => {
    if (!map) return;

    // Create a dedicated layer group for basemaps so overlays in overlayPane are untouched
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      group.clearLayers();
      map.removeLayer(group);
    };
  }, [map]);

  // Apply basemap style changes reliably to the actual Leaflet map instance
  useEffect(() => {
    if (!map || !layerGroupRef.current) return;

    // Skip if already applied
    if (currentAppliedStyleRef.current === activeBasemap) {
      return;
    }

    const currentSequence = ++sequenceIdRef.current;
    const targetDef = getBasemapDefinition(activeBasemap);

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Check if target basemap is marked available
    if (!targetDef.isAvailable) {
      if (onError) {
        onError(activeBasemap, targetDef.unavailableReason || 'Selected basemap provider is currently unavailable.');
      }
      return;
    }

    // Signal loading start
    if (onLoadingChange) {
      onLoadingChange(true, activeBasemap);
    }

    // Instantiate new Leaflet TileLayers
    const newTileLayers: L.TileLayer[] = targetDef.layers.map((l) =>
      L.tileLayer(l.url, {
        ...l.options,
        // Ensure tiles are drawn on base tilePane (z-index 200) below analytical vectors
        pane: 'tilePane',
      })
    );

    let hasApplied = false;
    let successfulTilesCount = 0;
    let failedTilesCount = 0;

    const finalizeSuccess = () => {
      if (hasApplied || sequenceIdRef.current !== currentSequence) return;
      hasApplied = true;

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      // Atomically swap the layers in the basemap LayerGroup
      const group = layerGroupRef.current;
      if (group) {
        group.clearLayers();
        newTileLayers.forEach((layer) => group.addLayer(layer));
      }

      currentAppliedStyleRef.current = activeBasemap;
      fallbackWorkingStyleRef.current = activeBasemap;

      if (onStyleApplied) {
        onStyleApplied(activeBasemap);
      }
      if (onLoadingChange) {
        onLoadingChange(false, null);
      }
    };

    const handleTileLoad = () => {
      successfulTilesCount++;
      // Once the first few tiles are confirmed valid or loaded, commit the style swap
      if (!hasApplied && successfulTilesCount >= 1) {
        finalizeSuccess();
      }
    };

    const handleTileError = () => {
      failedTilesCount++;
      // If excessive errors occur before any successful tile, handle failure
      if (!hasApplied && failedTilesCount > 6 && successfulTilesCount === 0) {
        if (sequenceIdRef.current !== currentSequence) return;
        hasApplied = true;

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // Clean up detached candidate layers
        newTileLayers.forEach((l) => {
          l.off();
        });

        const errorMsg = `Failed to load tiles for ${targetDef.label} (${targetDef.provider}). Kept previous working basemap.`;
        console.warn(`[RESQ-X Basemap] ${errorMsg}`);

        if (onError) {
          onError(activeBasemap, errorMsg);
        }
        if (onLoadingChange) {
          onLoadingChange(false, null);
        }
      }
    };

    // Attach listeners on candidate base layer
    const primaryLayer = newTileLayers[0];
    primaryLayer.on('tileload', handleTileLoad);
    primaryLayer.on('load', finalizeSuccess);
    primaryLayer.on('tileerror', handleTileError);

    // If initial mount or instant cached load, commit quickly
    if (newTileLayers.length > 0) {
      // Add candidate layer into group so it begins fetching tiles
      const group = layerGroupRef.current;
      if (group) {
        // If it's the very first basemap load, add directly
        if (!currentAppliedStyleRef.current) {
          newTileLayers.forEach((layer) => group.addLayer(layer));
          currentAppliedStyleRef.current = activeBasemap;
          fallbackWorkingStyleRef.current = activeBasemap;
          if (onStyleApplied) onStyleApplied(activeBasemap);
          if (onLoadingChange) onLoadingChange(false, null);
          return;
        }
      }
    }

    // Safety timeout: if network hangs for 6 seconds without any tileload or load event
    timeoutIdRef.current = setTimeout(() => {
      if (!hasApplied && sequenceIdRef.current === currentSequence) {
        if (successfulTilesCount > 0) {
          finalizeSuccess();
        } else {
          hasApplied = true;
          newTileLayers.forEach((l) => l.off());
          const errorMsg = `Connection timeout loading ${targetDef.label}. Keeping ${fallbackWorkingStyleRef.current}.`;
          console.warn(`[RESQ-X Basemap] ${errorMsg}`);
          if (onError) onError(activeBasemap, errorMsg);
          if (onLoadingChange) onLoadingChange(false, null);
        }
      }
    }, 6000);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      primaryLayer.off('tileload', handleTileLoad);
      primaryLayer.off('load', finalizeSuccess);
      primaryLayer.off('tileerror', handleTileError);
    };
  }, [map, activeBasemap, onLoadingChange, onStyleApplied, onError]);

  return null;
};

