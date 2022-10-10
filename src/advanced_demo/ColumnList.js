import React, { useState, useEffect, setState } from 'react';
function ColumnList(props){
    const {
        worksheet,
        updateSearch,
    } = props
    const [selectedColumns, setSelectedColumns] = useState('')
    const [selectedFilters, setselectedFilters] = useState('')
    const [chartFilter, setChartFilter] = useState('')

    function toggleColumn(col){
        if (selectedColumns.includes(col)){
            setSelectedColumns(selectedColumns.filter((e)=>(e !== col)),updateSearch(selectedColumns,selectedFilters,chartFilter))
        }else{
            setSelectedColumns([...selectedColumns, col], updateSearch(selectedColumns,selectedFilters,chartFilter))
        }
        
    }
    function toggleFilter(filter){
        console.log(filter,"filter!!")
        if (selectedColumns.includes(filter)){
            setselectedFilters(selectedFilters.filter((e)=>(e !== filter)),updateSearch(selectedColumns,selectedFilters,chartFilter))
        }else{
            setselectedFilters([...selectedFilters, filter], updateSearch(selectedColumns,selectedFilters,chartFilter))
        }
    }
    const [columns,setColumns] = useState('')
    useEffect(() => {
        updateSearch(selectedColumns,selectedFilters,chartFilter)
    }, [selectedColumns]);
    useEffect(() => {
        updateSearch(selectedColumns,selectedFilters,chartFilter)
    }, [selectedFilters]);
    useEffect(() => {
        window.addEventListener('chartFilter', function(e){
            setChartFilter(e.detail.name)
            updateSearch(selectedColumns,selectedFilters,e.detail.name)
        })
        getWorksheet()
    }, [])
    function getWorksheet(restURLParams){
        let formData = 'export_ids=%5B'+worksheet+'%5D&formattype=JSON&export_associated=false'
        let url = 'https://se-thoughtspot-cloud.thoughtspot.cloud/callosum/v1/tspublic/v1/metadata/tml/export'
        fetch(url,
        {
          headers: {
            'Accept': 'text/plain',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          method:'POST',
          credentials: 'include',
          body: formData
        })
        .then(response => response.text()).then(
          data => {
              var fileinfo = JSON.parse(data)
              var tml = JSON.parse(fileinfo.object[0].edoc)
              setColumns(tml.worksheet.worksheet_columns)
        })
      }
      var tables = {}
      for (var col of columns){
        var table = col.column_id ? col.column_id.split("::")[0] : 'FORMULAS'
        tables[table] ? tables[table].push(col.name) : tables[table] = [col.name]
      }

      var menu = []
      for (var tableName of Object.keys(tables)){
        var colOptions = []
        for (var col of tables[tableName]){
            colOptions.push(
                <Column worksheet={worksheet} col={col} toggleColumn={toggleColumn} toggleFilter={toggleFilter} isSelected={selectedColumns && selectedColumns.includes(col)}></Column>
            )
        }
        menu.push(<div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:'250px',maxWidth:'calc(vw / 6)'}}>
            <div style={{fontWeight:600,display:'flex',justifyContent:'flex-start',alignItems:'center',width:'100%',height:'35px',fontSize:'12px',marginBottom:'5px'}}>
                {tableName.replace("_1","").replace("_"," ")}
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',overflow:'auto',scrollbarWidth:'thin'}}>
            {colOptions}
            </div>
            </div>)
      }
      return (
        <div style={{height:'300px',width:'calc(100% - 40px)',margin:'15px',padding:'5px',boxShadow:'0px 0px 15px #e6e6e6',flexDirection:'column',display:'flex'}}>
                <div style={{margin:'10px',fontWeight:600,height:'25px'}}>Configuration</div>
                <div style={{marginLeft:'10px',marginRight:'10px',width:'calc(100% - 20px)',display:'flex',flexDirection:'row',overflowX:'auto'}}>
                    {menu}
                </div>
        </div>

      )
}
export default ColumnList

function Column(props){
    const {
        worksheet,
        col,
        isSelected,
        toggleColumn,
        toggleFilter
    } = props
    const [filterListVisible, setFilterListVisible] = useState('')
    function toggleColumnSelector(){
        toggleColumn(col)
    }
    function toggleFilterSelection(){
        setFilterListVisible(!filterListVisible)
    }
    return(
        <div style={{fontSize:'11px', wordWrap:'none',display:'flex',flexDirection:'row',minHeight:'30px',maxHeight:'30px',borderBottom:'1px solid #efefef',alignItems:'center'}} >
            <div  onClick={toggleColumnSelector} style={{marginRight:'5px', width:'18px',color:isSelected?'#898989':'#efefef',display:'flex',alignItems:'center'}}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -1.5 24 24" width="18" fill="currentColor"><path d="M4 .565h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4v-12a4 4 0 0 1 4-4z"></path></svg>
            </div>
            <div  onClick={toggleFilterSelection} style={{marginRight:'5px', width:'18px',color:'#cccccccc',display:'flex',alignItems:'center'}}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -2.5 24 24" width="18" fill="currentColor"><path d="M1.08.858h15.84a1 1 0 0 1 .78 1.625l-6.48 8.101a1 1 0 0 0-.22.625v5.149a1 1 0 0 1-.4.8l-2 1.5a1 1 0 0 1-1.6-.8v-6.65a1 1 0 0 0-.22-.624L.3 2.483A1 1 0 0 1 1.08.858z"></path></svg>
            </div>
            <div style={{display:'flex',alignItems:'center'}}> {col}</div>
            {filterListVisible?
                <div>
                    <div onClick={toggleFilterSelection} style={{zIndex:998,position:'fixed',top:0,left:0,width:'100vh',height:'100vh'}}>
                    </div>
                    <FilterPopup worksheet={worksheet} col={col} toggleFilter={toggleFilter}></FilterPopup>
                </div>
            :null}
        </div>
        
    )
}

function FilterPopup(props){
    const {
        worksheet,
        col,
        toggleFilter
    } = props
    
    const [filterValues, setFilterValues] = useState('')

    useEffect(() => {
        var queryString = '['+col+']'
        if (queryString){
            var url = "https://se-thoughtspot-cloud.thoughtspot.cloud/callosum/v1/tspublic/v1/searchdata?query_string="+encodeURIComponent(queryString)+
            "&data_source_guid="+worksheet+"&batchsize=-1&pagenumber=-1&offset=-1&formattype=COMPACT"
            fetch(url,
            {
                headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                },
                method:'POST',
                credentials: 'include',
            })
            .then(response => response.json()).then(
                data => {
                    setFilterValues(data.data)
            })
        }
    },[])
    var filterOptions = []
    for (var i=0;i<filterValues.length;i++){
        var val = filterValues[i][0];
        filterOptions.push(<Filter value={val} toggleFilter={toggleFilter}></Filter>)
    }
    return(
        <div style={{boxShadow:'0px 0px 25px #e0e0e0', zIndex:999,display:'flex',flexDirection:'column',position:'absolute',background:'#ffffff',padding:'10px'}}>
            {filterOptions}
        </div>


    )
}
function Filter(props){
    const {
        value,
        toggleFilter
    } = props
    function toggleFilterValue(){
        toggleFilter(value)
    }
    return (
        <div className="filterPicker" 
            onClick={toggleFilterValue}
            style={{height:'20px',
            padding:'5px',
            marginBottom:'5px',
            display:'flex',
            alignItems:'flex-start'}}>
            {value}
        </div>
    )
}