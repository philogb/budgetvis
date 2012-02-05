from BeautifulSoup import BeautifulStoneSoup as BS
from urllib2 import urlopen
import json
import math

#color settings
max_color = [252, 217, 161]
min_color = [173, 168, 251]

max_color2 = [241, 241, 241]
min_color2 = [22, 96, 105]

min_color2 = [201, 96, 22]
max_color2 = [22, 96, 201]


min_value = -100 
max_value = 100

def get_color(value, max_color=max_color2, min_color=min_color2,
    min_value=min_value, max_value=max_value):
  value = 10 * value
  value = min_value if value < min_value else value
  value = max_value if value > max_value else value
  rgb = [int(min_color[i] + (max_color[i] - min_color[i]) / float((max_value) - min_value) * \
             (value - min_value)) for i in range(0, 3)]
  return "#%02X%02X%02X" % (rgb[0], rgb[1], rgb[2])

def indicators_json():
  prefix_inf = 'http://www.whatwepayfor.com/api/getInflation?year='
  prefix_debt = 'http://www.whatwepayfor.com/api/getDebt?year='
  prefix_gdp = 'http://www.whatwepayfor.com/api/getGDP?year='
  prefix_pop = 'http://www.whatwepayfor.com/api/getPopulation?year='
  
  dim_inf = []
  dim_debt = []
  dim_debtpc = []
  dim_debtgdp = []
  dim_gdp = []
  dim_gdppc = []
  dim_pop = []

  for i in range(1985, 2011):
    year = str(i)
    print '>>>>>> year ', year
    
    #get inflation
    gdata = BS(urlopen(prefix_inf + year).read())
    item = gdata.find('item')
    amountii = float(item['avgchange'])
    dim_inf.append({
      'label': year,
      'values': max(amountii, 0)
    })

    #get population
    gdata = BS(urlopen(prefix_pop + year).read())
    item = gdata.find('item')
    amountii = float(item['changep'])
    dim_pop.append({
      'label': year,
      'values': max(amountii, 0)
    })

    #get GDP and GDP per capita
    gdata = BS(urlopen(prefix_gdp + year).read())
    item = gdata.find('item')
    amountii = float(item['amounti'])

    dim_gdp.append({
      'label': year,
      'values': max(amountii, 0)
    })
    dim_gdppc.append({
      'label': year,
      'values': max(float(item['percapitai']), 0)
    })
    
    #get debt data and debtpc
    gdata = BS(urlopen(prefix_debt + year).read())
    item = gdata.find('item')
    amountii = int(item['amounti'])
    dim_debt.append({
      'label': year,
      'values': max(amountii, 0),
#      'amounti': max(amountii, 0),
#      'gdpP': max(float(item.get('gdpp', 0)), 0),
#      'perCapitaI': max(float(item.get('percapitai', 0)), 0)
    })
    dim_debtpc.append({
      'label': year,
      'values': max(float(item.get('percapitai', 0)), 0)
    })
    dim_debtgdp.append({
      'label': year,
      'values': max(float(item.get('gdpp', 0)), 0)
    })
  
  with open('indicators/indicators.json', 'w') as f:
    indicators = {
      'inflation': {
        'label': ['indicator'],
        'values': dim_inf
      },
      'gdppc': {
        'label': ['indicator'],
        'values': dim_gdppc
      },
      'debtgdp': {
        'label': ['indicator'],
        'values': dim_debtgdp
      },
      'debtpc': {
        'label': ['indicator'],
        'values': dim_debtpc
      },
      'gdp': {
        'label': ['indicator'],
        'values': dim_gdp
      },
      'population': {
        'label': ['indicator'],
        'values': dim_pop
      },
      'debt': {
        'label': ['indicator'],
        'values': dim_debt
      }
    }
    f.write(json.dumps(indicators))

def histogram_json():
  group = {}
  subgroup = {}
  
  prefix = 'http://www.whatwepayfor.com/api/getBudgetAggregate?showExtra=1&adjustInflationYear=2011'

  for i in range(1985, 2013):
    year = str(i)
    print '>>>>>> year ', year
    #get function data
    gdata = BS(urlopen(prefix + '&group=function&year=' + year).read())
    total = {
      'label': year,
      'values': 0,
      'amounti': 0,
      'gdpP': 0,
      'perCapitaI': 0
    }
    for item in gdata.findAll('item'):
      dim = group.get(item['dimensionname'], [])
      amountii = int(item['amounti'])
      dim.append({
        'label': year,
        'values': max(amountii, 0),
        'amounti': max(amountii, 0),
        'gdpP': max(float(item.get('gdpp', 0)), 0),
        'perCapitaI': max(float(item.get('percapitai', 0)), 0)
      })
      group[item['dimensionname']] = dim
      
      total['values'] += amountii
      total['amounti'] += amountii
      total['gdpP'] += max(float(item.get('gdpp', 0)), 0)
      total['perCapitaI'] += max(float(item.get('percapitai', 0)), 0)
    
    #add total
    dim = group.get('_total', [])
    dim.append(total)
    group['_total'] = dim

    #get subfunction data
    gdata = BS(urlopen(prefix + '&group=subfunction&year=' + year).read())
    for item in gdata.findAll('item'):
      dim = subgroup.get(item['dimensionname'], [])
      dim.append({
        'label': year,
        'values': max(int(item['amounti']), 0),
        'amounti': max(int(item['amounti']), 0),
        'gdpP': max(float(item.get('gdpp', 0)), 0),
        'perCapitaI': max(float(item.get('percapitai', 0)), 0)
      })
      subgroup[item['dimensionname']] = dim

    for name, array in group.items():
      with open('aggregates/group.' + name + '.json', 'w') as f:
        f.write(json.dumps({
          'label': [name],
          'values': array
        }))

    for name, array in subgroup.items():
      with open('aggregates/subgroup.' + name + '.json', 'w') as f:
        f.write(json.dumps({
          'label': [name],
          'values': array
        }))


def tree_json():
  tree = {}
  prefix = 'http://www.whatwepayfor.com/api/getBudgetAggregate?&showChange=1&showExtra=1&adjustInflationYear=2011'
  list_prefix = 'http://www.whatwepayfor.com/api/getBudget?showChange=1&showExtra=1&adjustInflationYear=2011'

  #get previous total amount
  prev_total_amount = 0
  gdata = BS(urlopen(prefix + '&group=function&year=1984').read())
  for item in gdata.findAll('item'):
    prev_total_amount += int(item['amounti'])

  #create a tree for each year
  for i in range(1985, 2013):
    year = str(i)
    print '>>>>>> year ', year
    
    #get function data
    gdata = BS(urlopen(prefix + '&group=function&year=' + year).read())
    #get subfunction data
    gsdata = BS(urlopen(prefix + '&group=subfunction&year=' + year).read())
    #get list data
    gldata = BS(urlopen(list_prefix + '&year=' + year).read())

    total_amount = 0
    total_gdpp = 0
    for item in gdata.findAll('item'):
      total_amount += int(item['amounti'])
      total_gdpp += float(item.get('gdpp', 0))
    
    #create level1 nodes
    level1 = []
    for item in gdata.findAll('item'):
      amountii = int(item['amounti'])
      level1.append({
        'id': item['dimensionname'] + '-l1',
        'name': item['dimensionname'],
        'data': {
          '$dim': 0.1 if amountii < 0 else amountii,
          '$color':  "#70A35E", #get_color(float(item['changep'])),
          #budget amount in this function
          'amounti': amountii,
          #percentage of the total budget
          'budgetP': float(amountii) / total_amount * 100,
          #percentage of the GDP
          'gdpP': float(item.get('gdpp', -1)),
          #percentage change to last year
          'changeP': float(item['changep'])
        }
      });
    
    #create level2 nodes
    for node1 in level1:
      subfunctions = []
      for item in gldata.findAll('item', function= node1['name']):
        if not (item['subfunction'] in subfunctions):
          subfunctions.append(item['subfunction'])
      node1['children'] = children = []
      for subf in gsdata.findAll('item'):
        if subf['dimensionname'] in subfunctions:
          level3 = []
          amountii = int(subf['amounti'])
          children.append({
            'id': subf['dimensionname'] + '-l2-' + node1['name'],
            'name': subf['dimensionname'],
            'data': {
              '$dim': 0.1 if amountii < 0 else amountii,
              '$color': "#EBB056", #get_color(float(subf['changep'])),
              #budget amount in this function
              'amounti': int(subf['amounti']),
              #percentage of the total budget
              'budgetP': float(subf['amounti']) / total_amount * 100,
              #percentage of the GDP
              'gdpP': float(subf.get('gdpp', -1)),
              #percentage change to last year
              'changeP': float(subf['changep'])
            },
            'children': level3
          })
          #add level3 nodes
          for item in gldata.findAll('item', function= node1['name'],
              subfunction= subf['dimensionname']):
            amounti = float(item['amounti'])
            if amounti > 0:
              level3.append({
                'id': item['account'] + '-l3-' + subf['dimensionname'] + '-' + node1['name'],
                'name': item['account'],
                'data': {
                  '$dim': float(item['amounti']),
                  '$color': "#C74243", #get_color(float(item['changep'])),
                  #budget amount in this function
                  'amounti': float(item['amounti']),
                  #percentage of the total budget
                  'budgetP': float(item['amounti']) / total_amount * 100,
                  #percentage of the GDP
                  'gdpP': float(item.get('gdpp', -1)),
                  #percentage change to last year
                  'changeP': float(item['changep'])
                }
              })

      with open('trees/' + year + '.json', 'w') as f:
        f.write(json.dumps({
          'id': 'root',
          'name': 'Total Budget',
          'data': {
            '$dim': total_amount,
            '$color': "#416D9C",# get_color(float(total_amount - prev_total_amount) / total_amount),
            'amounti': total_amount,
            'changeP': float(total_amount - prev_total_amount) / total_amount,
            'budgetP': 100,
            'gdpp': total_gdpp,
          },
          'children': level1
        }))
        prev_total_amount = total_amount

if __name__ == '__main__':
  print 'creating indicators'
  indicators_json()
  print 'creating timelines for aggregated groups and subgroups'
#  histogram_json()
  print 'creating tree structures'
#  tree_json()


