import * as isEmpty from 'lodash.isempty'

export function transformObjectToList(tickets: object) {
  if (!isEmpty(tickets)) {
    const list = []

    Object.keys(tickets).forEach(k => {
      list.push(tickets[k])
    })

    return list
  }

  return null
}