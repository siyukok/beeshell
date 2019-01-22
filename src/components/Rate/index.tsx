import React, { Component } from 'react'
import { StyleSheet, View, PanResponder, InteractionManager } from 'react-native'

import { Icon } from '../Icon'
import styleObject from './styles'
export interface Props {
  value: number,
  maximum?: number,
  icons?: {
    emptyStar: JSX.Element,
    fullStar: JSX.Element,
    halfStar?: JSX.Element
  },
  starSize?: number,
  marginOfStar?: number,
  style?: any,
  /**
   * 只支持点击, 不响应滑动
   */
  clickOnly?: boolean,
  /**
   * 一旦开始选择,就不可以可以取消选择
   */
  allowCancel?: boolean,
  onChange?: Function,
  onChangeMove?: Function
}

export interface State {
  value: number
}

const Style = StyleSheet.create(styleObject as any)

export class Rate extends Component<Props, State> {
  static defaultProps = {
    maximum: 5,
    icons: {
      emptyStar: <Icon type='star' size={20} tintColor='#efefef' />,
      fullStar: <Icon type='star' size={20} />,
      halfStar: <Icon type='star-half' size={20} />
    },
    starSize: 20,
    marginOfStar: 4,
    clickOnly: false,
    allowCancel: true
  }

  private viewOnly = true
  private viewX = 0
  private panResponder = null
  private containerView = null

  constructor (p) {
    super(p)
    this.state = {
      value: p.value || 0
    }

    this.viewOnly = (p.onChange || p.onChangeMove) ? false : true

    if (!this.viewOnly) {
      this.createPanResponder()
    }
  }

  componentDidMount () {
    InteractionManager.runAfterInteractions(() => {
      this.containerView.measure((ox, oy, width, height, px, py) => {
        this.viewX = px
      })
    })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.value > 0 && nextProps.value !== this.props.value) {
      this.setState({ value: nextProps.value })
    }
  }

  render () {
    let extraProps = this.viewOnly ? {} : this.panResponder.panHandlers

    return (
      <View
        ref={c => { this.containerView = c }}
        style={[Style.warp, this.props.style]}
        {...extraProps}
        collapsable={false}
      >
        {this.getStars(this.state.value)}
      </View>
    )
  }

  getStars (currentRating) {
    const { icons: { halfStar, fullStar, emptyStar }, maximum, marginOfStar, starSize } = this.props

    const stars = []
    for (let i = 0; i < maximum; i++) {
      const extraProps = { key: i, style: { marginRight: marginOfStar, width: starSize, height: starSize } }
      if (
        halfStar &&
        currentRating > i &&
        currentRating < i + 1
      ) {
        stars.push(React.cloneElement(halfStar, extraProps))
      } else if (currentRating >= i + 1) {
        stars.push(React.cloneElement(fullStar, extraProps))
      } else {
        stars.push(React.cloneElement(emptyStar, extraProps))
      }
    }

    return stars
  }

  round (value) {
    // const { icons: { halfStar }, maximum, clickOnly } = this.props
    // 1、如果是点击 click 则仅 1.0 步长的计算
    // 2、如果是可以滑动，则可以 0.5 步长的计算
    // 3、如果 halfStar 没传进来，则 1.0 步长的计算
    // const inv = 1.0 / (clickOnly ? 1.0 : (halfStar ? 0.5 : 1.0))
    // const rating = halfStar ? Math.round(value * inv) / inv : Math.ceil(value)

    // 步长全部为 1 免得麻烦
    const { maximum } = this.props
    const rating = Math.ceil(value)
    if (rating < 0) {
      return 0
    } else if (rating > maximum) {
      return maximum
    }

    return rating
  }

  calcValRating (event, starWidth) {
    let value = this.round(
      (event.nativeEvent.pageX - this.viewX) / starWidth
    )
    // 强制用户一旦选择不能在取消
    if (!this.props.allowCancel && value < 1) {
      value = 1
    }

    this.setState({ value })
    return value
  }

  createPanResponder () {
    const { starSize, clickOnly, onChange, onChangeMove, marginOfStar } = this.props
    const starWidth = starSize + marginOfStar
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (event, gesture) => {
        const valueRating = this.calcValRating(event, starWidth)
        if (clickOnly === true) {
          onChange && onChange(valueRating)
        }
      },
      onPanResponderMove: (event, gesture) => {
        if (clickOnly === true) {
          return
        }
        const valueRating = this.calcValRating(event, starWidth)
        onChangeMove && onChangeMove(valueRating)
      },
      onPanResponderRelease: event => {
        if (clickOnly === true) {
          return
        }
        setTimeout(() => {
          onChange && onChange(this.state.value)
        }, 100)
      }
    })
  }
}