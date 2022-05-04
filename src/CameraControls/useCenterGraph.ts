import { useThree } from '@react-three/fiber';
import { useControls } from '.';
import { useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useHotkeys } from 'reakeys';
import { getLayoutCenter } from '../utils/layout';
import { InternalGraphNode } from '../types';

const PADDING = 50;

export interface CenterGraphInput {
  animated?: boolean;
  nodes: InternalGraphNode[];
}

export interface CenterGraphOutput {
  centerNodes: (nodes?: InternalGraphNode[]) => void;
  centerNodesById: (ids?: string[]) => void;
}

export const useCenterGraph = ({
  nodes,
  animated
}: CenterGraphInput): CenterGraphOutput => {
  const { invalidate } = useThree();
  const { controls } = useControls();

  const centerNodes = useCallback(
    (centerNodes: InternalGraphNode[], factor: number = 0) => {
      requestAnimationFrame(() => {
        // Centers the graph based on the central most node
        const { minX, maxX, minY, maxY, minZ, maxZ } =
          getLayoutCenter(centerNodes);

        controls?.fitToBox(
          new THREE.Box3(
            new THREE.Vector3(minX, minY, minZ + factor),
            new THREE.Vector3(maxX, maxY, maxZ + factor)
          ),
          animated,
          {
            paddingLeft: PADDING,
            paddingRight: PADDING,
            paddingBottom: PADDING,
            paddingTop: PADDING
          }
        );

        invalidate();
      });
    },
    [invalidate, controls, animated]
  );

  const centerNodesById = useCallback(
    (nodeIds?: string[]) => {
      let mappedNodes: InternalGraphNode[] | null = null;

      if (nodeIds?.length) {
        mappedNodes = nodeIds.reduce((acc, id) => {
          const node = nodes.find(n => n.id === id);
          if (node) {
            acc.push(node);
          } else {
            throw new Error(
              `Attempted to center ${id} but it was not found in the nodes`
            );
          }

          return acc;
        }, []);
      }

      centerNodes(mappedNodes || nodes);
    },
    [centerNodes, nodes]
  );

  // On load of graph, listen for center events and center the graph
  useEffect(() => {
    if (controls && nodes?.length) {
      centerNodes(nodes);
    }
  }, [controls, centerNodes, nodes]);

  useHotkeys([
    {
      name: 'Center',
      keys: ['command+shift+c'],
      callback: () => centerNodes(nodes)
    }
  ]);

  return { centerNodes, centerNodesById };
};