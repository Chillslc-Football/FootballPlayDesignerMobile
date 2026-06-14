import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Marker,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import {
  FIELD_ASPECT_RATIO,
  FIELD_LENGTH,
  FIELD_PADDING_LEFT,
  FIELD_PLAY_AREA_Y,
  FIELD_WIDTH,
  PLAYBOOK_LABEL_OFFSET,
  PLAYBOOK_SYMBOL_SIZE,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
} from './constants/field';
import { fieldTheme } from './theme/fieldTheme';
import type { Player, PlayerActionType, RenderPlay } from './types';
import { getFieldViewBounds, getHashMarks, getYardLines } from './utils/fieldView';
import {
  getActionStartPosition,
  getSortedChain,
} from './utils/playerActionChains';
import { getDefenderById } from './utils/preparePlayForRender';
import { getRouteVertices } from './utils/routeGeometry';

type ReadOnlyPlayDiagramProps = {
  play: RenderPlay;
};

type PathStroke = {
  stroke: string;
  strokeWidth?: number;
};

function renderPathSegments(
  vertices: Array<{ x: number; y: number }>,
  stroke: PathStroke,
  arrowMarkerId?: string,
) {
  if (vertices.length < 2) {
    return null;
  }

  const elements = [];

  for (let index = 0; index < vertices.length - 1; index += 1) {
    const start = vertices[index];
    const end = vertices[index + 1];
    const isLast = index === vertices.length - 2;

    elements.push(
      <Line
        key={`segment-${index}`}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={stroke.stroke}
        strokeWidth={stroke.strokeWidth ?? 0.21}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={isLast && arrowMarkerId ? `url(#${arrowMarkerId})` : undefined}
      />,
    );
  }

  return elements;
}

function strokeForActionType(type: PlayerActionType): PathStroke {
  switch (type) {
    case 'block':
      return { stroke: fieldTheme.blockStroke, strokeWidth: 0.21 };
    case 'motion':
      return { stroke: fieldTheme.motionStroke, strokeWidth: 0.21 };
    default:
      return { stroke: fieldTheme.routeStroke, strokeWidth: 0.21 };
  }
}

function renderOffenseActions(play: RenderPlay, arrowMarkerId: string) {
  return play.players.flatMap((player) => {
    const chain = getSortedChain(play.playerActions ?? {}, player.id);

    return chain.flatMap((action, actionIndex) => {
      if (action.points.length === 0) {
        return [];
      }

      const startPosition = getActionStartPosition(player.position, chain, actionIndex);
      const vertices = getRouteVertices(startPosition, {
        playerId: player.id,
        points: action.points,
      });
      const useArrow = action.type === 'route';

      return (
        <G key={`${player.id}-${action.id}`}>
          {renderPathSegments(
            vertices,
            strokeForActionType(action.type),
            useArrow ? arrowMarkerId : undefined,
          )}
        </G>
      );
    });
  });
}

function renderDefenderRoutes(play: RenderPlay, arrowMarkerId: string) {
  return play.defenderRoutes.flatMap((route) => {
    if (route.points.length === 0) {
      return [];
    }

    const defender = getDefenderById(play, route.defenderId);
    if (!defender) {
      return [];
    }

    const vertices = getRouteVertices(defender.position, {
      playerId: 'QB',
      points: route.points,
    });

    return (
      <G key={`defender-route-${route.defenderId}`}>
        {renderPathSegments(vertices, { stroke: fieldTheme.routeStroke }, arrowMarkerId)}
      </G>
    );
  });
}

function renderPlayerMarker(player: Player) {
  const { x, y } = player.position;

  return (
    <G key={player.id} transform={`translate(${x}, ${y})`}>
      <Circle
        r={PLAYBOOK_SYMBOL_SIZE / 2}
        fill={fieldTheme.offenseFill}
        stroke={fieldTheme.offenseStroke}
        strokeWidth={0.12}
      />
      <SvgText
        fill={fieldTheme.offenseText}
        fontSize={PLAYBOOK_SYMBOL_SIZE}
        fontWeight="700"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        O
      </SvgText>
      {player.label ? (
        <SvgText
          y={PLAYBOOK_LABEL_OFFSET}
          fill={fieldTheme.labelText}
          fontSize={0.75}
          fontWeight="600"
          textAnchor="middle"
        >
          {player.label}
        </SvgText>
      ) : null}
    </G>
  );
}

function renderDefenderMarker(defender: RenderPlay['defenders'][number]) {
  const { x, y } = defender.position;

  return (
    <G key={defender.id} transform={`translate(${x}, ${y})`}>
      <Circle
        r={PLAYBOOK_SYMBOL_SIZE / 2}
        fill={fieldTheme.defenseFill}
        stroke={fieldTheme.defenseStroke}
        strokeWidth={0.12}
      />
      <SvgText
        fill={fieldTheme.defenseText}
        fontSize={PLAYBOOK_SYMBOL_SIZE}
        fontWeight="700"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        X
      </SvgText>
      {defender.label ? (
        <SvgText
          y={PLAYBOOK_LABEL_OFFSET}
          fill={fieldTheme.labelText}
          fontSize={0.75}
          fontWeight="600"
          textAnchor="middle"
        >
          {defender.label}
        </SvgText>
      ) : null}
    </G>
  );
}

export function ReadOnlyPlayDiagram({ play }: ReadOnlyPlayDiagramProps) {
  const arrowMarkerId = `route-arrow-${play.id}`;

  const previewPlay = useMemo(
    () => play,
    [play],
  );

  const viewBounds = useMemo(
    () => getFieldViewBounds(previewPlay.driveStartYardLine),
    [previewPlay.driveStartYardLine],
  );

  const yardLines = useMemo(() => getYardLines(viewBounds), [viewBounds]);
  const hashMarks = useMemo(() => getHashMarks(), []);

  const turfStripes = useMemo(() => {
    const stripes: Array<{ y: number; light: boolean }> = [];
    for (let y = 0; y < FIELD_LENGTH; y += 5) {
      stripes.push({ y, light: Math.floor(y / 5) % 2 === 0 });
    }
    return stripes;
  }, []);

  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <Defs>
          <Marker
            id={arrowMarkerId}
            markerWidth={0.76}
            markerHeight={0.76}
            refX={0.65}
            refY={0.38}
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <Polygon
              points="0,0 0.76,0.38 0,0.76"
              fill={fieldTheme.routeStroke}
            />
          </Marker>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          fill={fieldTheme.viewBoxBackground}
        />

        <G transform={`translate(${FIELD_PADDING_LEFT}, ${FIELD_PLAY_AREA_Y})`}>
          <Rect x={0} y={0} width={FIELD_WIDTH} height={FIELD_LENGTH} fill={fieldTheme.turf} />

          {turfStripes.map((stripe) => (
            <Rect
              key={`stripe-${stripe.y}`}
              x={0}
              y={stripe.y}
              width={FIELD_WIDTH}
              height={5}
              fill={stripe.light ? fieldTheme.turfStripeLight : fieldTheme.turfStripeDark}
              opacity={0.35}
            />
          ))}

          <Rect
            x={0}
            y={0}
            width={FIELD_WIDTH}
            height={FIELD_LENGTH}
            fill="none"
            stroke={fieldTheme.line}
            strokeWidth={0.35}
          />

          {yardLines.map((line) => (
            <Line
              key={line.viewY}
              x1={0}
              y1={line.viewY}
              x2={FIELD_WIDTH}
              y2={line.viewY}
              stroke={fieldTheme.line}
              strokeWidth={line.isMajor ? 0.32 : 0.14}
              opacity={line.isMajor ? 1 : 0.9}
            />
          ))}

          {hashMarks.map((mark) => (
            <Line
              key={`hash-${mark.viewY}-${mark.x}`}
              x1={mark.x}
              y1={mark.viewY - 0.4}
              x2={mark.x}
              y2={mark.viewY + 0.4}
              stroke={fieldTheme.line}
              strokeWidth={0.12}
            />
          ))}

          <Line
            x1={0}
            y1={viewBounds.losViewY}
            x2={FIELD_WIDTH}
            y2={viewBounds.losViewY}
            stroke={fieldTheme.losLine}
            strokeWidth={0.35}
          />

          {renderOffenseActions(previewPlay, arrowMarkerId)}
          {renderDefenderRoutes(previewPlay, arrowMarkerId)}
          {previewPlay.defenders.map(renderDefenderMarker)}
          {previewPlay.players.map(renderPlayerMarker)}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: FIELD_ASPECT_RATIO,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
});
