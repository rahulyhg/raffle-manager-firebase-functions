import * as isEmpty from 'lodash.isempty'

export function transformObjectToList(obj: object) {
  if (!isEmpty(obj)) {
    const list = []

    Object.keys(obj).forEach(k => {
      list.push(obj[k])
    })

    return list
  }

  return null
}

interface ITicket {
  _id: string,
  firstName: string,
  lastName: string,
  ticketCount: number,
}

export function mergeTicketsToList(tickets: object): Array<ITicket> | null {
  if (!isEmpty(tickets)) {
    const list = []

    Object.keys(tickets).forEach(k => {
      let ticket = { ...tickets[k], _id: k }
      list.push(ticket)
    })

    return list
  }

  return null
}