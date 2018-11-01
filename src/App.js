import React, { Component } from 'react';
import raf from 'raf';
import { TransitionMotion, presets, spring } from 'react-motion';
import './App.css';

const defaultCards = [
	{ id: 'card1', text: 'Hello' },
	{ id: 'card2', text: 'Hello 2' },
	{ id: 'card3', text: 'Hello 3' }
];

class App extends Component {
	render() {
		return (
			<div className="App">
				<CardContainer cards={defaultCards} />
			</div>
		);
	}
}

export default App;

class CardContainer extends Component {
	constructor(props) {
		super(props);

		this.state = {
			draggingIndex: -1,
			cards: props.cards
		};

		this.handleDragStart = this.handleDragStart.bind(this);
		this.handleDragEnd = this.handleDragEnd.bind(this);
		this.handleDragEnd = this.handleDragEnd.bind(this);
	}

	handleDragStart(index) {
		return e => {
			this.setState({
				draggingIndex: index
			});
		};
	}

	handleDragEnd() {
		this.setState({
			draggingIndex: -1
		});
	}

	handleCardLeave(id) {
		return () => {
			this.setState(prevState => ({
				cards: prevState.cards.filter(c => c.id !== id)
			}));
		};
	}

	getDefaultStyles = () => {
		return this.state.cards.map(card => ({
			key: card.id,
			data: card,
			style: { maxHeight: 0, opacity: 1, marginTop: 0, marginBottom: 0 }
		}));
	};

	getStyles = () => {
		const { cards } = this.state;
		return cards.map((card, i) => {
			return {
				key: card.id,
				data: card,
				style: {
					maxHeight: spring(1000, presets.gentle),
					opacity: spring(1, presets.gentle),
					marginBottom: spring(20, presets.gentle),
					martinTop: spring(20, presets.gentle)
				}
			};
		});
	};

	willEnter() {
		return {
			maxHeight: 0,
			opacity: 1,
			marginTop: 20,
			marginBottom: 20
		};
	}

	willLeave() {
		return {
			maxHeight: spring(0),
			opacity: spring(0),
			marginTop: spring(0),
			marginBottom: spring(0)
		};
	}

	render() {
		return (
			<div ref={r => (this.wrap = r)} className="card-container">
				<TransitionMotion
					defaultStyles={this.getDefaultStyles()}
					styles={this.getStyles()}
					willEnter={this.willEnter}
					willLeave={this.willLeave}>
					{styles => {
						return (
							<div>
								{styles.map((style, index) => {
									const card = style.data;
									return (
										<div
											key={style.key}
											style={style.style}
											className="card-wrap">
											<Card
												{...card}
												handleDragStart={this.handleDragStart(
													index
												)}
												handleDragEnd={
													this.handleDragEnd
												}
												handleCardLeave={this.handleCardLeave(
													card.id
												)}
											/>
										</div>
									);
								})}
							</div>
						);
					}}
				</TransitionMotion>
			</div>
		);
	}
}

class Card extends Component {
	constructor(props) {
		super(props);

		this.state = {
			startX: 0,
			currentX: 0,
			changeX: 0,
			bcr: {},
			style: {
				opacity: 1
			}
		};

		this.onStart = this.onStart.bind(this);
		this.onMove = this.onMove.bind(this);
		this.onEnd = this.onEnd.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.update = this.update.bind(this);
	}

	onStart(e) {
		if (this.props.draggingDisabled) {
			return;
		}

		this.raf = raf(this.update);

		const startX = e.pageX || e.touches[0].pageX;

		this.props.handleDragStart();

		this.setState(prevState => {
			return {
				startX,
				currentX: startX,
				bcr: this.card.getBoundingClientRect(),
				style: {
					...prevState.style,
					willChange: 'transform'
				}
			};
		});
	}

	onMove(e) {
		if (this.props.draggingDisabled) {
			return;
		}

		const currentX = e.pageX || e.touches[0].pageX;

		this.setState({
			currentX
		});
	}

	onEnd() {
		if (this.props.draggingDisabled) {
			return;
		}

		raf.cancel(this.raf);

		// If you've dragged at lease 50% of the width of the card, check!!!
		if (Math.abs(this.state.changeX) > this.state.bcr.width * 0.5) {
			const x =
				this.state.changeX > 0
					? this.state.bcr.width
					: this.state.bcr.width * -1;
			this.setState(prevState => ({
				changeX: x,
				currentX: x,
				startX: 0,
				style: {
					...prevState.style,
					opacity: 0,
					willChange: 'initial'
				}
			}));

			this.props.handleCardLeave();
		} else {
			// Else return to the middle
			this.onCancel();
		}

		this.props.handleDragEnd();
	}

	onCancel() {
		raf.cancel(this.raf);
		this.setState(prevState => ({
			currentX: 0,
			startX: 0,
			changeX: 0,
			style: {
				...prevState.style,
				opacity: 1,
				willChange: 'initial'
			}
		}));
	}

	update() {
		this.raf = raf(this.update);

		const changeX = this.state.currentX - this.state.startX;

		const normalizedDragDistance =
			Math.abs(changeX) / (this.state.bcr.width || 1);
		const opacity = 1 - Math.pow(normalizedDragDistance, 3);

		this.setState(prevState => ({
			changeX,
			style: {
				...prevState.style,
				opacity: typeof opacity === 'number' ? opacity : 1
			}
		}));
	}

	render() {
		return (
			<div
				ref={r => (this.card = r)}
				className="card"
				style={{
					...this.state.style,
					transform: `translate3d(${this.state.changeX}px, 0, 0)`,
					transition: `transform 150ms cubic-bezier(0,0,0.31,1)`
				}}
				onTouchStart={this.onStart}
				onTouchMove={this.onMove}
				onTouchEnd={this.onEnd}
				onMouseDown={this.onStart}
				onMouseMove={this.onMove}
				onMouseUp={this.onEnd}
				onMouseOut={this.onCancel}>
				{this.props.text}
			</div>
		);
	}
}
