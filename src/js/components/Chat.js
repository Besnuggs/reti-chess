'use strict';

const React = require('react/addons');
const ChatStore = require('../stores/ChatStore');
const ChatActions = require('../actions/ChatActions');

const Chat = React.createClass({
  
  propTypes: {
    io: React.PropTypes.object.isRequired,
    token: React.PropTypes.string.isRequired,
    color: React.PropTypes.oneOf(['white', 'black']).isRequired,
    soundsEnabled: React.PropTypes.bool.isRequired
  },
  mixins: [React.addons.PureRenderMixin],

  getInitialState() {
    const state = ChatStore.getState();
    return {
      isChatHidden: state.isChatHidden,
      messages: state.messages,
      message: '',
    };
  },
  componentDidMount() {
    this.props.io.on('receive-message', data => {
      ChatActions.submitMessage(data.message, data.color + ' left');
      this._maybePlaySound();
    });
    ChatStore.on('change', this._onChatStoreChange);
  },
  componentWillUnmount() {
    ChatStore.off('change', this._onChatStoreChange);
  },
  render() {
    return (
      <div id="chat-wrapper"
           style={this.state.isChatHidden ? {display: 'none'} : null}>
        <h4>Chat</h4>
        <a className="close"
           onClick={this._toggleChat}>
          x
        </a>
        <audio preload="auto" ref="msgSnd">
          <source src="/snd/message.mp3" />
        </audio>
        <ul id="chat-list" ref="chat">
          {this.state.messages.map((message, i) => (
            <li key={i} className={message.get('className')}>
              {message.get('message')}
            </li>
          )).toArray()}
        </ul>
        <span>Write your message:</span>
        <form id="chat-form"
              onSubmit={this._submitMessage}>
          <input type="text"
                 className={this.props.color}
                 required
                 value={this.state.message}
                 onChange={this._onChangeMessage} />
        </form>
      </div>
    );
  },
  _onChatStoreChange() {
    this.setState(ChatStore.getState(), this._scrollChat);
  },
  _toggleChat(e) {
    e.preventDefault();
    ChatActions.toggleChat();
  },
  _onChangeMessage(e) {
    this.setState({message: e.target.value});
  },
  _submitMessage(e) {
    e.preventDefault();
    const {io, token, color} = this.props;
    const message = this.state.message;

    ChatActions.submitMessage(message, color + ' right');
    this.setState({message: ''});

    io.emit('send-message', {
      message: message,
      color: color,
      token: token
    });
  },
  _scrollChat() {
    const chatNode = this.refs.chat.getDOMNode();
    chatNode.scrollTop = chatNode.scrollHeight;
  },
  _maybePlaySound() {
    if (this.props.soundsEnabled) {
      this.refs.msgSnd.getDOMNode().play();
    }
  }
});

module.exports = Chat;