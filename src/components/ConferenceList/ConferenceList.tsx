import * as React from 'react';
import {Component} from 'react';
import {filter, groupBy, sortBy as _sortBy} from 'lodash';
import {isPast, parse, format} from 'date-fns';
import {connectInfiniteHits} from 'react-instantsearch/connectors';

import TwitterFollowButton from '../TwitterFollowButton';
import Heading from '../Heading';
import Divider from '../Divider';
import Link from '../Link';
import ConferenceItem from '../ConferenceItem';
import styles from './ConferenceList.scss';

interface Props {
  showCFP: boolean;
  sortBy: string;
  hasMore?: boolean;
  hits?: Conference[];
  topics?: string[];
  onLoadMore(): void;
}

class ConferenceList extends Component<Props, never> {
  renderConferences = (conferences: Conference[]) => {
    const {showCFP} = this.props;
    return (
      <div key={'list'} className={styles.ConferenceList}>
        {getConfsMonthsSorted(conferences).map((monthKey: string) => {
          const month = monthKey.split('-')[1];
          return (
            <Months
              key={monthKey}
              month={month}
              showCFP={showCFP}
              conferences={conferences[monthKey]}
            />
          );
        })}
      </div>
    );
  };

  render() {
    const {hits, showCFP, sortBy, hasMore, onLoadMore, topics} = this.props;
    let filteredConferences = hits as Conference[];
    if (showCFP) {
      filteredConferences = filter(hits, conf => {
        return conf.cfpEndDate && !isPast(parse(conf.cfpEndDate));
      }) as Conference[];
    }
    const confs = groupAndSortConferences(filteredConferences, sortBy);

    const confsTable = Object.keys(confs).map(year => {
      return [
        <Divider key="hr" />,
        <Year key={year} year={year} topics={topics} />,
        this.renderConferences(confs[year]),
      ];
    });

    return (
      <div>
        {confsTable}
        {hasMore && (
          <Link button onClick={onLoadMore}>
            Load more
          </Link>
        )}
      </div>
    );
  }
}

function groupAndSortConferences(
  conferences: Conference[],
  sortBy = 'startDate'
) {
  // Group conferences by year
  // FIXME: remove any
  const confs: any = groupBy(conferences, conf => format(conf[sortBy], 'YYYY'));

  // Group conferences by month within the year
  Object.keys(confs).map((year: string) => {
    confs[year] = groupBy(confs[year], conf => format(conf[sortBy], 'YYYY-MM'));
    Object.keys(confs[year]).map(month => {
      confs[year][month] = _sortBy(
        confs[year][month],
        conference => conference[sortBy]
      );
    });
  });

  return confs;
}

function getMonthName(month: string) {
  return format(parse(`2017/${month}/01`), 'MMMM');
}

interface MonthsProps {
  month: string;
  showCFP: boolean;
  conferences: Conference[];
}

class Months extends Component<MonthsProps> {
  render() {
    const {month, conferences, showCFP} = this.props;
    return [
      <Heading key={month} element="h2" level={3}>
        {getMonthName(month)}
      </Heading>,
      conferences.map(conf => {
        return (
          <ConferenceItem {...conf} key={conf.objectID} showCFP={showCFP} />
        );
      }),
    ];
  }
}

function Year({year, topics}: {year: string; topics?: string[]}) {
  const topic = topics && topics.length > 0 ? `&TOPIC=${topics[0]}` : '';
  return (
    <div className={styles.Year}>
      <div>
        <Heading key={year} element="h2" level={2}>
          {year}
        </Heading>
        <Link
          external
          url={`https://tech.us19.list-manage.com/subscribe?u=246492d8cf0efc8c4ec6a9a60&id=84b8d4723e${topic}`}
        >
          Subscribe to our newsletter
        </Link>
      </div>
      <div className={styles.AddConference}>
        <AddConferenceLink />
        <TwitterFollowButton />
      </div>
    </div>
  );
}

function getConfsMonthsSorted(conferences: Conference[]) {
  return _sortBy(Object.keys(conferences), conference => {
    return parseInt(conference.replace('-', ''), 10);
  });
}

function AddConferenceLink() {
  return (
    <div className={styles.AddConfPanelWrapper}>
      <Link url="/conferences/new" routed>
        Add a conference
      </Link>
    </div>
  );
}

export default connectInfiniteHits(ConferenceList);
