// Svelte 5 runes-based reactive scene state

type SceneMode =
	| 'draw'
	| 'bounce'
	| 'revenge'
	| 'aquarium'
	| 'neonField'
	| 'solarSystem'
	| 'globe'
	| 'aurora'
	| 'synthwave'
	| 'neural';

interface SceneInfo {
	name: string;
	mode: SceneMode;
	color: string;
}

function createSceneState() {
	let currentScene = $state<SceneMode>('revenge');
	let scenes = $state<SceneInfo[]>([]);

	return {
		get currentScene() {
			return currentScene;
		},
		set currentScene(value: SceneMode) {
			currentScene = value;
		},
		get scenes() {
			return scenes;
		},
		set scenes(value: SceneInfo[]) {
			scenes = value;
		}
	};
}

export const sceneState = createSceneState();
